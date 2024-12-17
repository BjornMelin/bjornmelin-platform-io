import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda';
import { appRouter } from './router';
import { createContext } from './context';
import { SecretsManager } from 'aws-sdk';

const secretsManager = new SecretsManager();

export const handler = async function(event) {
    const secretName = 'blog-app-secrets'; // Name of your secret in Secrets Manager

    try {
        const secretData = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
        const secrets = JSON.parse(secretData.SecretString || '{}');

        return awsLambdaRequestHandler({
            router: appRouter,
            createContext: async () => {
                return createContext({ req: { headers: event.headers }, res: null, secrets });
            },
        })(event);
    } catch (error) {
        console.error('Error retrieving secrets or handling request:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};
