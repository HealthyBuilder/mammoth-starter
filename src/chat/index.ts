import { settings } from "@elizaos/core";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on("SIGINT", () => {
  rl.close();
  process.exit(0);
});

// Function to get the latest block hash from Celestia's API
async function getLatestBlockHash() {
  try {
    const response = await fetch('https://api-mainnet.celenium.io/v1/head'); // Celestia API endpoint
    const data = await response.json();
    return data.hash; // The block hash is in the 'hash' field
  } catch (error) {
    console.error("Error fetching block hash:", error);
    return null;
  }
}

// Function to handle user input
async function handleUserInput(input, agentId) {
  if (input.toLowerCase() === "exit") {
    rl.close();
    process.exit(0);
  }

  try {
    let finalInput = input;


    // Check if the input contains the "fortune" keyword
    if (input.toLowerCase().includes("fortune")) {
      const blockHash = await getLatestBlockHash();
      if (blockHash) {
        // If we successfully fetched the block hash, append it to the input
        finalInput = `${input} (Latest block hash: ${blockHash})`;
        console.log(`Latest Block Hash: ${blockHash}`);
      } else {
        console.error("Failed to fetch block hash, continuing with original input.");
      }
    }

    // Send the final input to the agent
    const serverPort = parseInt(settings.SERVER_PORT || "3000");

    const response = await fetch(
      `http://localhost:${serverPort}/${agentId}/message`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: finalInput,
          userId: "user",
          userName: "User",
        }),
      }
    );

    const data = await response.json();
    for (const message of data) {
      console.log(`${"Agent"}: ${message.text}`);
    }
  } catch (error) {
    console.error("Error fetching response:", error);
  }
}

export function startChat(characters) {
  function chat() {
    const agentId = characters[0].name ?? "Agent";
    rl.question("You: ", async (input) => {
      await handleUserInput(input, agentId);
      if (input.toLowerCase() !== "exit") {
        chat(); // Loop back to ask another question
      }
    });
  }

  return chat;
}
