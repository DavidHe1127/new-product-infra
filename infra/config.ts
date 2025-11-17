import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config("aws");
const appConfig = new pulumi.Config("app");

const profile = config.require("profile");
const stack = pulumi.getStack();

export const app = {
	name: appConfig.require("name"),
	dir: appConfig.require("dir"),
};

export const provider = {
	apse2: new aws.Provider(`${stack}-apse2`, {
		region: "ap-southeast-2",
		profile,
	}),
	use1: new aws.Provider(`${stack}-use1`, {
		region: "us-east-1",
		profile,
	}),
};
