import * as path from "node:path";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as syncedFolder from "@pulumi/synced-folder";

import { app, provider } from "./config";

const bucket = new aws.s3.Bucket(
	`${app.name}-bucket`,
	{
		bucket: app.name,
	},
	{
		provider: provider.apse2,
	},
);

const ownershipControls = new aws.s3.BucketOwnershipControls(
	`${app.name}-bucket-ownership-control`,
	{
		bucket: bucket.bucket,
		rule: {
			objectOwnership: "BucketOwnerPreferred",
		},
	},
	{
		provider: provider.apse2,
	},
);

const publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
	`${app.name}-bucket-public-access-block`,
	{
		bucket: bucket.bucket,
		blockPublicAcls: true,
		blockPublicPolicy: true,
		ignorePublicAcls: true,
		restrictPublicBuckets: true,
	},
	{
		provider: provider.apse2,
	},
);

new syncedFolder.S3BucketFolder(
	`${app.name}-bucket-folder`,
	{
		path: path.resolve(__dirname, `../${app.dir}`),
		bucketName: bucket.bucket,
		acl: "private",
	},
	{
		provider: provider.apse2,
		dependsOn: [ownershipControls, publicAccessBlock],
	},
);

const distributionOAC = new aws.cloudfront.OriginAccessControl(
	`${app.name}-distrobution-oac`,
	{
		description: `${app.name} Distribution OAC`,
		originAccessControlOriginType: "s3",
		signingBehavior: "always",
		signingProtocol: "sigv4",
	},
	{
		provider: provider.apse2,
	},
);

const cachePolicy = new aws.cloudfront.CachePolicy(
	`${app.name}-distribution-cache-policy`,
	{
		comment: `${app.name} distribution default cache behaviour policy`,
		defaultTtl: 600,
		maxTtl: 600,
		minTtl: 600,

		parametersInCacheKeyAndForwardedToOrigin: {
			enableAcceptEncodingGzip: true,
			enableAcceptEncodingBrotli: true,
			cookiesConfig: {
				cookieBehavior: "none",
			},
			queryStringsConfig: {
				queryStringBehavior: "all",
			},
			headersConfig: {
				headerBehavior: "none",
			},
		},
	},
	{
		provider: provider.apse2,
	},
);

const cdn = new aws.cloudfront.Distribution(
	`${app.name}-distribution`,
	{
		enabled: true,
		comment: `${app.name} distribution`,
		origins: [
			{
				originId: bucket.arn,
				originAccessControlId: distributionOAC.id,
				domainName: bucket.bucketRegionalDomainName,
			},
		],
		defaultCacheBehavior: {
			targetOriginId: bucket.arn,
			compress: true,
			viewerProtocolPolicy: "redirect-to-https",
			allowedMethods: ["GET", "HEAD", "OPTIONS"],
			cachedMethods: ["GET", "HEAD", "OPTIONS"],
			cachePolicyId: cachePolicy.id,
		},
		customErrorResponses: [
			{
				errorCode: 403,
				responseCode: 200,
				responsePagePath: "/index.html",
			},
			{
				errorCode: 404,
				responseCode: 200,
				responsePagePath: "/index.html",
			},
		],
		priceClass: "PriceClass_All",
		restrictions: {
			geoRestriction: {
				restrictionType: "none",
			},
		},
		viewerCertificate: {
			cloudfrontDefaultCertificate: true,
			// To accept HTTPS connections from only viewers that support SNI
			sslSupportMethod: "sni-only",
		},
		defaultRootObject: "index.html",
	},
	{
		provider: provider.use1,
	},
);

const bucketPolicyDoc = aws.iam.getPolicyDocumentOutput(
	{
		statements: [
			{
				sid: "AllowCloudFrontServicePrincipalReadOnly",
				principals: [
					{
						type: "Service",
						identifiers: ["cloudfront.amazonaws.com"],
					},
				],
				effect: "Allow",
				actions: ["s3:GetObject", "s3:GetObjectVersion"],
				resources: [`arn:aws:s3:::${app.name}/*`],
				conditions: [
					{
						test: "StringEquals",
						variable: "aws:SourceArn",
						values: [cdn.arn],
					},
				],
			},
		],
	},
	{
		provider: provider.apse2,
	},
);

new aws.s3.BucketPolicy(
	`${app.name}-bucket-policy`,
	{
		bucket: bucket.bucket,
		policy: bucketPolicyDoc.apply((policyDoc) => policyDoc.json),
	},
	{
		provider: provider.apse2,
	},
);

export const cdnURL = pulumi.interpolate`https://${cdn.domainName}`;
export const cdnHostname = cdn.domainName;
