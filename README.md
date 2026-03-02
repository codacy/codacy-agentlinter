# Codacy Agentlinter

This is an integration created so that Codacy can run the [agentlinter](https://github.com/seojoonkim/agentlinter)
tool in its infrastructure, or using its [CLI](https://github.com/codacy/codacy-analysis-cli).

agentlinter is a static analysis tool for AI agent configuration files (CLAUDE.md, AGENTS.md, etc.).

## Generating documentation

```bash
npm install
npm run build:docs
```

## Build docker image

```bash
docker build -t codacy-agentlinter .
```

## Test changes to codacy-seed locally

You may need to test changes that come from our [codacy-engine-typescript-seed](https://github.com/codacy/codacy-engine-typescript-seed).

1. Create a package with your changes on the seed:
    * Don't forget to update the dependencies: `npm install`
    * Compile the library: `npm run compile`
    * Package the library: `npm pack`
        > This should generate a codacy-seed-0.0.1.tgz on your codacy-seed repository

2.  Copy the `codacy-seed-0.0.1.tgz` into the root of this repository

3.  Install the package: `npm install codacy-seed-0.0.1.tgz`

4.  Update Dockerfile and `.dockerignore` so you copy the `codacy-seed-0.0.1.tgz` inside the docker you will be building
    *  Add `!codacy-seed-0.0.1.tgz` to your `.dockerignore`
    *  Add the package to the docker before `RUN npm install`: `COPY codacy-seed-0.0.1.tgz ./`
    *  Remove multi-stage docker steps
        *  Lines from `FROM node:$NODE_IMAGE_VERSION` to `RUN rm -rf /package.json /package-lock.json`
        > This way you skip copying the files to the other docker, and another `npm install`

5.  Publish your docker locally as normal: `docker build -t codacy-agentlinter .`

## What is Codacy

[Codacy](https://www.codacy.com/) is an Automated Code Review Tool that monitors your technical debt, helps you improve your code quality, teaches best practices to your developers, and helps you save time in Code Reviews.

### Among Codacy's features

- Identify new Static Analysis issues
- Commit and Pull Request Analysis with GitHub, BitBucket/Stash, GitLab (and also direct git repositories)
- Auto-comments on Commits and Pull Requests
- Integrations with Slack, HipChat, Jira, YouTrack
- Track issues in Code Style, Security, Error Proneness, Performance, Unused Code and other categories

Codacy also helps keep track of Code Coverage, Code Duplication, and Code Complexity.

Codacy supports PHP, Python, Ruby, Java, JavaScript, and Scala, among others.

### Free for Open Source

Codacy is free for Open Source projects.
