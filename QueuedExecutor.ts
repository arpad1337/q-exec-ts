import * as events from "events";

type PositiveIntegerForwardType<T extends number> =
  `${T}` extends '0' | `-${any}` | `${any}.${any}` ? never : T

export type PositiveInteger = PositiveIntegerForwardType<number>;

export enum QueuedExecutorEvents {
  BufferEmpty = "bufferEmpty",
  Finished = "finished",
}

export interface QueuedExecutorDelegate<T extends Array<any>> {
  exec: (...args: T) => Promise<void>;
}

export class QueuedExecutor<T extends Array<any>> extends events.EventEmitter {
  private _buffer: Array<T>;
  private _maxConcurrency: PositiveInteger;
  private _delayBetweenUploads: PositiveInteger;
  private _delegate: QueuedExecutorDelegate<T>;
  private _currentExecCount: PositiveInteger;
  private _shouldFinish: boolean;

  constructor(
    maxConcurrency: PositiveInteger,
    delay: PositiveInteger,
    delegate: QueuedExecutorDelegate<T>
  ) {
    super();
    if (maxConcurrency === 0) {
      maxConcurrency = 1;
    }

    this._buffer = [];
    this._maxConcurrency = maxConcurrency;
    this._delayBetweenUploads = delay;
    this._delegate = delegate;
    this._currentExecCount = 0;
    this._shouldFinish = false;
  }

  push(...args: T) {
    if (this._buffer.length < this._maxConcurrency) {
      setTimeout(() => this._next(), this._delayBetweenUploads);
    }
    this._buffer.push(args);
  }

  inputStreamClosed() {
    this._shouldFinish = true;
    if (this._currentExecCount === 0 && this._buffer.length === 0) {
      this.emit(QueuedExecutorEvents.Finished);
    }
  }

  private async _next() {
    if (
      this._currentExecCount < this._maxConcurrency &&
      this._buffer.length > 0
    ) {
      this._currentExecCount++;
    } else {
      return;
    }
    const commandArgs: T = this._buffer.shift()!;
    await this._delegate.exec(...commandArgs);
    this._currentExecCount--;
    if (this._buffer.length > 0) {
      setTimeout(() => this._next(), this._delayBetweenUploads);
    } else if (this._currentExecCount === 0 && this._shouldFinish) {
      this.emit(QueuedExecutorEvents.Finished);
    } else {
      this.emit(QueuedExecutorEvents.BufferEmpty);
    }
  }
}
