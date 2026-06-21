// AWS Amplify Configuration
import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID || '',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      signUpVerificationMethod: 'code' as const,
      loginWith: {
        email: true,
        username: true,
      },
    },
  },
  API: {
    GraphQL: {
      endpoint: process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT || '',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      defaultAuthMode: 'userPool' as const,
    },
  },
  Storage: {
    S3: {
      bucket: process.env.NEXT_PUBLIC_S3_BUCKET || '',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    },
  },
};

// Initialize Amplify
if (typeof window !== 'undefined') {
  Amplify.configure(awsConfig);
}

export default awsConfig;
