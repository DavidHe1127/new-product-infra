# David He's New Product
It contains a website and its infra to display David's new product. Please visit the website at https://d33r46kxfnjkg2.cloudfront.net/.

## Pre-requisites

### Tooling Dependencies

Make sure these runtime/tools are installed on your local machine:

- NodeJS
- [Taskfile](https://taskfile.dev/)
- [Pulumi Cli](https://www.pulumi.com/docs/get-started/download-install/)

### AWS Credentials

Ensure that your IAM role has the following permissions attached and configure an AWS profile called `dev` that assumes this role.

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:DeleteBucket",
                "s3:DeleteBucketPolicy",
                "s3:List*",
                "s3:Get*",
                "s3:Put*",
                "s3:DeleteObject",
                "s3:AbortMultipartUpload"
            ],
            "Resource": [
                "arn:aws:s3:::*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudfront:Get*",
                "cloudfront:List*",
                "cloudfront:CreateDistribution",
                "cloudfront:UpdateDistribution",
                "cloudfront:DeleteDistribution",
                "cloudfront:CreateOriginAccessControl",
                "cloudfront:UpdateOriginAccessControl",
                "cloudfront:DeleteOriginAccessControl",
                "cloudfront:CreateCachePolicy",
                "cloudfront:UpdateCachePolicy",
                "cloudfront:DeleteCachePolicy",
                "cloudfront:TagResource",
                "cloudfront:UntagResource"
            ],
            "Resource": "*"
        }
    ]
}
```

## Quick Start

To get started, run the following commands from the project root:

1. Install dependencies:

```
npm install
```

2. Login to Pulumi local backend:

```
task login
```

3. Preview the deployment:

```
task preview
```

4. Deploy the website:

```
task up
```

5. Tear down the deployment (optional cleanup step):

```
task destroy
```

---

## Q&A

### What else you would do with your website, and how you would go about doing it if you had more time.

I'd make the follwing improvements:

- Register a custom domain and configure a certificate to my distribution so that users can visit my site using a link that reflects my business domain.
- Add a firewall to my distribution via AWS WAF to protect it from cyber attacks.
- Prevent access to my site from default distribution domain. This can be achieved via WAF.
- Enable standard logging.
- Enable monitoring & alerting on common metrics - error rate, cache hit rate and origin latency.
- Dockerising tasks in Taskfile to create consistent dev environment.

### Alternative solutions that you could have taken but didn’t and explain why.

#### Containerization Technologies

EKS/ECS can also be used to host a website. But, they don't have out-of-box support for common features like caching and static content optimization etc you'd see in CDN (CloudFront). Additionally, setting up a production-ready EKS can be time-consuming and more costly. Therefore, they're not suitable.

#### Virtual Machines (EC2)

Hosting a website on EC2 requires significant setup and ongoing management. This includes configuring networking, managing the server, implementing autoscaling and load balancing for high availability and scalability. You would also need to bake a custom AMI, preinstall and configure Nginx, and regularly patch the AMI for vulnerabilities. This approach adds considerable administrative overhead.

#### Serverless (API Gateway + Lambda)

Using API Gateway with Lambda also involves additional setup. While cold-start latency can be mitigated with provisioned concurrency, this architecture is primarily designed for hosting APIs rather than static websites.

### What would be required to make this a production grade website that would be developed by various development teams. The more detail, the better!

I'd look from the following perspectives to transform it to a prod-ready website:

#### CI/CD & Deployment

- Implement CI/CD using GitHub Actions, configuring AWS access via OIDC.
- Add GitHub Environments for multi-environment support. This also allows for approval gates setup for production releases if needed.
- Track DORA metrics (Deployment Frequency, Lead Time, Change Failure Rate, MTTR) to measure delivery performance.
- Implement release process using [Release Please](https://github.com/googleapis/release-please). This tool is quite mature and I've had some success with it at my current workplace.

#### Governance & Compliance

- Add a `CODEOWNERS` file to ensure code changes are reviewed by relevant code owners - suppose infra and app are managed and owned by different teams.
- Enforce coding standards: linting, formatting, commit message conventions.
- Use a CNAPP tool like ORCA to continuously monitor deployed infra and maintain a strong security posture.
- Use a SAST tool like Snyk to scan app dependencies and facilitate vulnerabilities detection and remediation.
