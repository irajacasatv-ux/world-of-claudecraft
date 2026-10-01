export type InstructionRef = { line: number; kind: 'script' | 'path' | 'module'; token: string };

export type InstructionIndex = {
  exists: (p: string) => boolean;
  isModuleSpecifier: (p: string) => boolean;
  suffixExists: (p: string) => boolean;
  hasBasename: (name: string) => boolean;
  isTopDir: (segment: string) => boolean;
};

export declare function isInstructionFile(file: string): boolean;
export declare function buildIndex(tracked: string[]): InstructionIndex;
export declare function extractRefs(text: string): InstructionRef[];
export declare function unresolvedRefs(args: {
  file: string;
  refs: InstructionRef[];
  index: InstructionIndex;
  scripts: Set<string>;
}): InstructionRef[];
export declare function packageScriptsFor(args: {
  file: string;
  files: Set<string>;
  readScripts: (packageJson: string) => string[];
}): Set<string>;
