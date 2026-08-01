export type Repository = {
  fullName: string | null;
  url: string;
  defaultName: string;
};

export function parseRepository(input: string): Repository {
  const shorthand = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?$/.exec(
    input,
  );
  if (shorthand) {
    const fullName = `${shorthand[1]}/${shorthand[2]}`;
    return {
      fullName,
      url: `https://github.com/${fullName}.git`,
      defaultName: shorthand[2],
    };
  }

  const githubUrl =
    /^(?:https:\/\/github\.com\/|git@github\.com:)([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?$/.exec(
      input,
    );
  if (githubUrl) {
    const fullName = `${githubUrl[1]}/${githubUrl[2]}`;
    return {
      fullName,
      url: `https://github.com/${fullName}.git`,
      defaultName: githubUrl[2],
    };
  }

  if (!input.startsWith("https://") && !input.startsWith("git@")) {
    throw new Error(
      "Repository must be owner/name, an HTTPS Git URL, or an SSH Git URL",
    );
  }

  const path = input
    .replace(/\.git$/, "")
    .split(/[/:]/)
    .filter(Boolean);
  const defaultName = path.at(-1);
  if (!defaultName)
    throw new Error("Could not determine a service name from the repository");
  return { fullName: null, url: input, defaultName };
}
