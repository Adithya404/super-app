import { tool } from "ai";
import { z } from "zod";

export const getWeather = tool({
  description: "Get the weather in a location (fahrenheit)",
  inputSchema: z.object({
    city: z.string().describe("The city to get the weather for"),
  }),
  contextSchema: z.object({
    apiKey: z.string(),
    accountId: z.string(),
  }),
  execute: async ({ city }, { context }) => {
    if (!context.apiKey || !context.accountId) {
      throw new Error("API key and account ID are required to get weather");
    }
    const temperature = Math.round(Math.random() * (90 - 32) + 32);
    return {
      city,
      temperature,
    };
  },
});

export const convertFahrenheitToCelsius = tool({
  description: "Convert a temperature in fahrenheit to celsius",
  inputSchema: z.object({
    temperature: z.number().describe("The temperature in fahrenheit to convert"),
  }),
  execute: async ({ temperature }) => {
    const celsius = Math.round(((temperature - 32) * 5) / 9);
    return {
      celsius,
    };
  },
});
