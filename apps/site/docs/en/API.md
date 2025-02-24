# API

## Constructor

There are multiple agents in Midscene, each with its own constructor.

* In Puppeteer, use [PuppeteerAgent](./integrate-with-puppeteer)
* In Bridge mode, use [AgentOverChromeBridge](./bridge-mode-by-chrome-extension#constructor)

Here are the common options for all agents:

* `generateReport: boolean`: If true, the agent will generate a report file. Default is true.
* `autoPrintReportMsg: boolean`: If true, the agent will print the report message. Default is true.
* `cacheId: string | undefined`: If set, the agent will use this cacheId to match the cache. Default is undefined.

And also, puppeteer agent has an extra option:

* `forceSameTabNavigation`: If true, the agent will limit the popup to the current page. Default is true.

## Methods

These are the main methods on all kinds of agents in Midscene.

> In the following documentation, you may see functions called with the `agent.` prefix. If you use destructuring in Playwright, like `async ({ ai, aiQuery }) => { /* ... */}`, you can call the functions without this prefix. It's just a matter of syntax.

### `.aiAction(steps: string)` or `.ai(steps: string)` - Interact with the page

You can use `.aiAction` to perform a series of actions. It accepts a `steps: string` as a parameter, which describes the actions. In the prompt, you should clearly describe the steps. Midscene will take care of the rest.

`.ai` is the shortcut for `.aiAction`.

These are some good samples:

```typescript
await agent.aiAction('Enter "Learn JS today" in the task box, then press Enter to create');
await agent.aiAction('Move your mouse over the second item in the task list and click the Delete button to the right of the second task');

// use `.ai` shortcut
await agent.ai('Click the "completed" status button below the task list');
```

Steps should always be clearly and thoroughly described. A very brief prompt like 'Tweet "Hello World"' will result in unstable performance and a high likelihood of failure. 

Under the hood, Midscene will plan the detailed steps by sending your page context and a screenshot to the AI. After that, Midscene will execute the steps one by one. If Midscene deems it impossible to execute, an error will be thrown. 

The main capabilities of Midscene are as follows, and your task will be split into these types. You can see them in the visualized report:

1. **Locator**: Identify the target element using a natural language description
2. **Action**: Tap, scroll, keyboard input, hover
3. **Others**: Sleep

Currently, Midscene can't plan steps that include conditions and loops.

Related Docs:
* [FAQ: Can Midscene smartly plan the actions according to my one-line goal? Like executing "Tweet 'hello world'](./faq)
* [Prompting Tips](./prompting-tips)

### `.aiQuery(dataDemand: any)` - extract any data from page

You can extract customized data from the UI. Provided that the multi-modal AI can perform inference, it can return both data directly written on the page and any data based on "understanding". The return value is in JSON format, so it should be valid primitive types, like String, Number, JSON, Array, etc. Just describe it in the `dataDemand`.

For example, to parse detailed information from page:

```typescript
const dataA = await agent.aiQuery({
  time: 'date and time, string',
  userInfo: 'user info, {name: string}',
  tableFields: 'field names of table, string[]',
  tableDataRecord: 'data record of table, {id: string, [fieldName]: string}[]',
});
```

You can also describe the expected return value format as a plain string:

```typescript
// dataB will be a string array
const dataB = await agent.aiQuery('string[], task names in the list');

// dataC will be an array with objects
const dataC = await agent.aiQuery('{name: string, age: string}[], Data Record in the table');
```

### `.aiAssert(assertion: string, errorMsg?: string)` - do an assertion

`.aiAssert` works just like the normal `assert` method, except that the condition is a prompt string written in natural language. Midscene will call AI to determine if the `assertion` is true. If the condition is not met, an error will be thrown containing `errorMsg` and a detailed reason generated by AI.

```typescript
await agent.aiAssert('The price of "Sauce Labs Onesie" is 7.99');
```

:::tip
Assertions are usually a very important part of your script. To prevent the possibility of AI hallucinations ( especially for the false negative situation ), you can also use `.aiQuery` + normal JavaScript assertions to replace the `.aiAssert` calls.

For example, to replace the previous assertion,

```typescript
const items = await agent.aiQuery(
  '"{name: string, price: number}[], return item name and price of each item',
);
const onesieItem = items.find(item => item.name === 'Sauce Labs Onesie');
expect(onesieItem).toBeTruthy();
expect(onesieItem.price).toBe(7.99);
```
:::

### `.aiWaitFor(assertion: string, {timeoutMs?: number, checkIntervalMs?: number })` - wait until the assertion is met

`.aiWaitFor` will help you check if your assertion has been met or a timeout error occurred. Considering the AI service cost, the check interval will not exceed `checkIntervalMs` milliseconds. The default config sets `timeoutMs` to 15 seconds and `checkIntervalMs` to 3 seconds: i.e. check at most 5 times if all assertions fail and the AI service always responds immediately.

When considering the time required for the AI service, `.aiWaitFor` may not be very efficient. Using a simple `sleep` method might be a useful alternative to `waitFor`.

```typescript
await agent.aiWaitFor("there is at least one headphone item on page");
```

### `.runYaml(yamlScriptContent: string)` - run a yaml script

`.runYaml` will run the `tasks` part of the yaml script and return the result of all the `.aiQuery` calls (if any). The `target` part of the yaml script will be ignored in this function.

To ignore some errors while running, you can set the `continueOnError` option in the yaml script. For more details about the yaml script schema, please refer to [Automate with Scripts in YAML](./automate-with-scripts-in-yaml).

```typescript
const { result } = await agent.runYaml(`
tasks:
  - name: search weather
    flow:
      - ai: input 'weather today' in input box, click search button
      - sleep: 3000

  - name: query weather
    flow:
      - aiQuery: "the result shows the weather info, {description: string}"
        name: weather
`);
console.log(result);
```

## Properties

### `.reportFile`

The report file path of the agent.

## More

### Setting environment variables during runtime

You can set environment variables during runtime by calling `overrideAIConfig` method.

```typescript
import { overrideAIConfig } from '@midscene/web/puppeteer'; // or other agent

overrideAIConfig({
  OPENAI_BASE_URL: "...",
  OPENAI_API_KEY: "...",
  MIDSCENE_MODEL_NAME: "..."
});

// ...
```

### AI profiling

By setting `MIDSCENE_DEBUG_AI_PROFILE`, you can take a look at the time and token consumption of AI calls.

```shell
export MIDSCENE_DEBUG_AI_PROFILE=1
```

### Use LangSmith

LangSmith is a platform designed to debug the LLMs. To integrate LangSmith, please follow these steps:

```shell
# set env variables

# Flag to enable debug
export MIDSCENE_LANGSMITH_DEBUG=1 

# LangSmith config
export LANGSMITH_TRACING_V2=true
export LANGSMITH_ENDPOINT="https://api.smith.langchain.com"
export LANGSMITH_API_KEY="your_key_here"
export LANGSMITH_PROJECT="your_project_name_here"

# Due to a backward compatibility issue of LangSmith, for users who use Midscene <= 0.10.6, you need to set the variables starting with `LANGCHAIN_` instead of `LANGSMITH_`. 
```

Launch Midscene, you should see logs like this:

```log
DEBUGGING MODE: langsmith wrapper enabled
```
