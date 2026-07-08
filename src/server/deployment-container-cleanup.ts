type DockerCommandResult = {
  code: number | null;
  stdout: string;
  stderr: string;
};

type LogStream = "system" | "stdout" | "stderr";

type RemoveDeploymentContainerOptions = {
  containerName: string;
  log: (line: string, stream?: LogStream) => void;
  runBufferedDocker: (args: string[]) => Promise<DockerCommandResult>;
};

function appendOutputLines(output: string, stream: LogStream, log: (line: string, stream?: LogStream) => void) {
  for (const line of output.split(/\r?\n/)) {
    if (line.trim().length > 0) {
      log(line, stream);
    }
  }
}

export async function removeDeploymentContainer({ containerName, log, runBufferedDocker }: RemoveDeploymentContainerOptions) {
  const args = ["rm", "-f", containerName];
  log(`Cleaning up failed deployment container ${containerName}...`, "stderr");
  log(`$ docker ${args.join(" ")}`);

  const result = await runBufferedDocker(args);
  const detail = (result.stderr || result.stdout || `docker rm exited with ${result.code}`).trim();
  if (result.code !== 0 && /No such container/i.test(detail)) {
    log(`No failed deployment container named ${containerName} was present.`);
    return;
  }

  appendOutputLines(result.stdout, "stdout", log);
  appendOutputLines(result.stderr, "stderr", log);

  if (result.code !== 0) {
    log(`Failed to clean up deployment container ${containerName}: ${detail}`, "stderr");
  }
}
