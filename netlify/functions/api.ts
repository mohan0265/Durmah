import { awsLambdaFastify } from '@fastify/aws-lambda';
import { buildServer } from '../../apps/server/src/app';

let memoizedHandler; // Renamed variable

async function initialize() {
  const server = await buildServer();
  return awsLambdaFastify(server);
}

export const handler = async (event, context) => {
  if (!memoizedHandler) {
    memoizedHandler = await initialize();
  }
  return memoizedHandler(event, context);
};
