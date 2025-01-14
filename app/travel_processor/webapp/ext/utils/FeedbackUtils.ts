import { promises as fs } from "fs";
import * as path from "path";

export async function handleFeedback(sFeedback: string, sAIResponse: string) {
  console.log("Feedback for " + sAIResponse + ": " + sFeedback);

  //TODO: write feedback to file
}
