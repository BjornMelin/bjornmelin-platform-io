import { awsLambdaRequestHandler } from "@trpc/server/adapters/aws-lambda";
import { appRouter } from "../../../src/server/api/root";
import { createContext } from "../../../src/server/api/context";

exports.handler = awsLambdaRequestHandler({
    router: appRouter,
    createContext,
});
