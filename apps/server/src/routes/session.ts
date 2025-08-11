import { FastifyPluginAsync } from 'fastify';
import { SessionManager } from '../core/session';
import { providerRegistry } from '../providers/registry';

const sessionManager = new SessionManager();

export const sessionRoutes: FastifyPluginAsync = async (server) => {
  // Start a new session
  server.post('/start', async (request, reply) => {
    const { configId } = request.body as { configId: string };
    
    // Create session with default org for now
    const session = await sessionManager.createSession({
      configId,
      orgId: 'default'
    });
    
    return {
      sessionId: session.id,
      token: session.token
    };
  });

  // WebSocket streaming endpoint
  server.register(async function (server) {
    server.get('/stream', { websocket: true }, async (connection, request) => {
      const { token } = request.query as { token: string };
      
      // Validate session token
      const session = sessionManager.validateToken(token);
      if (!session) {
        connection.socket.close(1008, 'Invalid token');
        return;
      }

      // Initialize providers
      const llmProvider = providerRegistry.getLLM('openai');
      const sttProvider = providerRegistry.getSTT('openai-stt');
      const ttsProvider = providerRegistry.getTTS('elevenlabs');
      
      if (!llmProvider || !sttProvider || !ttsProvider) {
        connection.socket.close(1011, 'Providers not available');
        return;
      }
      
      let sttSessionId: string | null = null;
      let isProcessing = false;

      // Handle incoming messages
      connection.socket.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'start_listening') {
            if (!sttSessionId) {
              sttSessionId = await sttProvider.startSession({
                orgId: session.orgId,
                traceId: session.id
              });
            }
            
            // Send greeting on first listen
            if (session.messages.length === 0) {
              await sendAssistantMessage(
                "Hello! I'm Durmah, your law study companion. How can I help you today?",
                connection,
                session,
                ttsProvider
              );
            }
          }
          
          if (data.type === 'stop_listening') {
            // Handle stop listening if needed
          }
          
          if (data.type === 'audio_chunk' && sttSessionId && !isProcessing) {
            // Process audio chunk
            const audioBuffer = Buffer.from(data.audio, 'base64');
            const result = await sttProvider.pushAudio(sttSessionId, {
              audio: audioBuffer,
              sequence: data.sequence || 0,
              isFinal: data.isFinal || false
            });
            
            if (result) {
              if (!result.isFinal) {
                // Send partial transcript
                connection.socket.send(JSON.stringify({
                  type: 'partial_transcript',
                  text: result.text
                }));
              } else {
                // Send final transcript and process
                connection.socket.send(JSON.stringify({
                  type: 'final_transcript',
                  text: result.text
                }));
                
                // Add user message to session
                session.messages.push({
                  role: 'user',
                  content: result.text
                });
                
                // Process with LLM
                isProcessing = true;
                await processUserMessage(result.text, connection, session, llmProvider, ttsProvider);
                isProcessing = false;
              }
            }
          }
          
        } catch (error) {
          console.error('WebSocket message error:', error);
          connection.socket.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process message'
          }));
        }
      });

      // Handle connection close
      connection.socket.on('close', async () => {
        if (sttSessionId) {
          await sttProvider.endSession(sttSessionId);
        }
      });
    });
  });

  // End session
  server.post('/:sessionId/end', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    sessionManager.endSession(sessionId);
    return { success: true };
  });
};

async function processUserMessage(
  userMessage: string,
  connection: any,
  session: any,
  llmProvider: any,
  ttsProvider: any
) {
  try {
    // Prepare messages for LLM
    const messages = [
      {
        role: 'system' as const,
        content: 'You are Durmah, a helpful AI assistant for law students. Provide clear, concise, and encouraging responses to help with their studies. Keep responses conversational and supportive.'
      },
      ...session.messages.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    // Get LLM response
    let assistantResponse = '';
    const llmStream = llmProvider.complete({
      messages,
      temperature: 0.2,
      maxTokens: 2048
    }, {
      orgId: session.orgId,
      traceId: session.id
    });

    for await (const chunk of llmStream) {
      if (chunk.delta) {
        assistantResponse += chunk.delta;
      }
    }

    // Add assistant message to session
    session.messages.push({
      role: 'assistant',
      content: assistantResponse
    });

    // Send assistant message and speak it
    await sendAssistantMessage(assistantResponse, connection, session, ttsProvider);

  } catch (error) {
    console.error('Error processing user message:', error);
    connection.socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to process your message'
    }));
  }
}

async function sendAssistantMessage(
  message: string,
  connection: any,
  session: any,
  ttsProvider: ElevenLabsTTS
) {
  try {
    // Send text message
    connection.socket.send(JSON.stringify({
      type: 'assistant_message',
      text: message
    }));

    // Start speaking
    connection.socket.send(JSON.stringify({
      type: 'assistant_speaking_started'
    }));

    // Generate TTS (simplified for now - in production would stream audio)
    await ttsProvider.speak({
      text: message,
      voiceId: session.voiceId || 'Rachel'
    }, {
      orgId: session.orgId,
      traceId: session.id
    });

    // Simulate speaking duration (in production, this would be based on actual audio length)
    const speakingDuration = Math.max(2000, message.length * 50); // Rough estimate
    setTimeout(() => {
      connection.socket.send(JSON.stringify({
        type: 'assistant_speaking_finished'
      }));
    }, speakingDuration);

  } catch (error) {
    console.error('Error sending assistant message:', error);
    connection.socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to generate speech'
    }));
  }
}

