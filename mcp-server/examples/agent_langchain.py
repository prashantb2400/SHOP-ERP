"""
Example: Connecting Python AI Agent (LangChain / CrewAI / custom) to RetailFlow MCP Server.

Requirements:
  pip install langchain-mcp-adapters langchain-openai
"""

import asyncio
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI

async def main():
    # 1. Initialize MCP Client connecting to RetailFlow
    async with MultiServerMCPClient({
        "retailflow": {
            "command": "node",
            "args": ["../bin/cli.js"],
            "transport": "stdio",
        }
    }) as client:
        # 2. Retrieve ERP tools automatically
        tools = client.get_tools()
        print(f"Connected to RetailFlow! Discovered {len(tools)} tools:")
        for t in tools:
            print(f" - {t.name}: {t.description[:60]}...")

        # 3. Bind tools to LLM
        model = ChatOpenAI(model="gpt-4o", temperature=0).bind_tools(tools)

        # 4. Agent query
        prompt = "Check our current inventory for any low-stock items and create an invoice for TechCorp Solutions for 1 GaN charger on cash."
        print(f"\nUser: {prompt}\n")
        response = await model.ainvoke(prompt)
        print("Agent Tool Calls:", response.tool_calls)

if __name__ == "__main__":
    asyncio.run(main())
