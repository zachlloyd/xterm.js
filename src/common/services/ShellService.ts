/**
 * Copyright (c) 2019 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import { IShellService, ShellState, ShellAction, IOptionsService } from "common/services/Services";
import { EventEmitter, IEvent } from "common/EventEmitter";
import { Disposable } from "common/Lifecycle";

export class ShellService extends Disposable implements IShellService {
  public serviceBrand: any;

  public state : ShellState;
  public prompt : string | undefined;
  public pwd : string | undefined;

  private _onStateChange = new EventEmitter<{
    priorState: ShellState;
    newState: ShellState;
    action: ShellAction;
  }>();

  public get onStateChange(): IEvent<{
    priorState: ShellState;
    newState: ShellState;
    action: ShellAction;
  }> {
    return this._onStateChange.event;
  }

  constructor(@IOptionsService private _optionsService: IOptionsService) {
    super();
    this.state = ShellState.UNKNOWN;
  }

  public dispose(): void {
    super.dispose();
  }
 
  precmd(prompt: string): void {
    const priorState = this.state;
    this.prompt = prompt;
    this.state = ShellState.AWAITING_INPUT;
    this._onStateChange.fire({
      priorState,
      newState: this.state,
      action: ShellAction.PRECMD_HOOK
    });
  }

  preexec(): void {
    const priorState = this.state;
    this.state = ShellState.EXECUTING_COMMAND;
    this._onStateChange.fire({
      priorState,
      newState: this.state,
      action: ShellAction.PREEXEC_HOOK
    });
  }

  chpwd(oldpwd: string, pwd: string): void {
    this.pwd = pwd;
  }
}
