import { Project, ProjectOptions } from "ts-morph";
import * as path from "path";

/**
 * Singleton to manage the ts-morph Project.
 * This ensures we only parse the tsconfig once and share the cache.
 */
class DiscoveryProject {
  private static instance: Project;

  public static getInstance(): Project {
    if (!DiscoveryProject.instance) {
      const tsConfigPath = path.resolve(process.cwd(), "tsconfig.json");

      const options: ProjectOptions = {
        tsConfigFilePath: tsConfigPath,
        // Optimization: Don't load every single file immediately to save memory.
        // Extractors will add the specific folders they need.
        skipAddingFilesFromTsConfig: true,
      };

      DiscoveryProject.instance = new Project(options);

      // Resolve path aliases (@/* -> src/*) by manually confirming root dirs
      const compilerOptions = DiscoveryProject.instance.getCompilerOptions();
      console.log(
        `📂 Project Root: ${compilerOptions.baseUrl || process.cwd()}`
      );
    }

    return DiscoveryProject.instance;
  }
}

export const project = DiscoveryProject.getInstance();
