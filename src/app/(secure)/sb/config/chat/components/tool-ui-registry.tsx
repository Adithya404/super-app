import type { LucideIcon } from "lucide-react";
import { CloudIcon, SearchIcon, ThermometerIcon, WrenchIcon } from "lucide-react";

export interface ToolUIConfig {
  icon: LucideIcon;
  getLabel: (input: unknown) => string;
  artifactTitle: string;
  artifactBaseName: string;
}

const defaultToolUI: ToolUIConfig = {
  icon: WrenchIcon,
  getLabel: (input) => {
    if (input && typeof input === "object") {
      return "Running tool...";
    }
    return "Running tool...";
  },
  artifactTitle: "Tool result",
  artifactBaseName: "result",
};

export const toolUIRegistry: Record<string, ToolUIConfig> = {
  getWeather: {
    icon: CloudIcon,
    getLabel: (input) => {
      if (input && typeof input === "object" && "city" in input) {
        const city = (input as { city: unknown }).city;
        if (typeof city === "string") {
          return `Getting weather for ${city}`;
        }
      }
      return "Getting weather...";
    },
    artifactTitle: "Weather result",
    artifactBaseName: "weather",
  },
  convertFahrenheitToCelsius: {
    icon: ThermometerIcon,
    getLabel: (input) => {
      if (input && typeof input === "object" && "temperature" in input) {
        const temperature = (input as { temperature: unknown }).temperature;
        if (typeof temperature === "number") {
          return `Converting ${temperature}°F to Celsius`;
        }
      }
      return "Converting temperature...";
    },
    artifactTitle: "Temperature conversion",
    artifactBaseName: "conversion",
  },
  browser_search: {
    icon: SearchIcon,
    getLabel: (input) => {
      if (input && typeof input === "object" && "query" in input) {
        const query = (input as { query: unknown }).query;
        if (typeof query === "string") {
          return `Searching for "${query}"`;
        }
      }
      return "Searching the web...";
    },
    artifactTitle: "Search result",
    artifactBaseName: "search",
  },
};

export function getToolUI(name: string): ToolUIConfig {
  return (
    toolUIRegistry[name] ?? {
      ...defaultToolUI,
      getLabel: () => `Using ${name}`,
      artifactTitle: `${name} result`,
      artifactBaseName: name,
    }
  );
}

export function getArtifactFilename(name: string, language: string): string {
  const { artifactBaseName } = getToolUI(name);

  switch (language) {
    case "typescript":
      return `${artifactBaseName}.ts`;
    case "python":
      return `${artifactBaseName}.py`;
    case "yaml":
      return `${artifactBaseName}.yaml`;
    default:
      return `${artifactBaseName}.json`;
  }
}
