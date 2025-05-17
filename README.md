# q-exec-ts
QueuedExecutor in TypeScript

# Usage

```typescript

  import * as events from "events";
  import { 
      QueuedExecutor, 
      QueuedExecutorDelegate, 
      QueuedExecutorEvents
  } from "./QueuedExecutor"
  
  ...
  
  type ArgsType = [string];
  
  const delegate: QueuedExecutorDelegate<ArgsType> = {
      exec: async (...args: ArgsType): Promise<void> => {
          try {
              ...
              await doSomethingAsync(args[0]);
              ...
          } catch (e) {
              console.error(e);
              // ...
          }
      }
  };
  
  const executor = new QueuedExecutor<ArgsType>(
      maxConcurrency, 
      100, // throtling in ms
      delegate
  );
  
  ...
  
  executor.push(someString);
  
  ...
  
  executor.inputStreamClosed();
  
  ...
  
  await events.once(executor, QueuedExecutorEvents.Finished); 

```

# Author

@arpad1337

# License

MIT
