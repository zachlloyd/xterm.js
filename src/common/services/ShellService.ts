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
  public shellSuggestions : string[];

  private suggestionBuffer : string;

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
    this.shellSuggestions = [];
    this.suggestionBuffer = "";
  }

  public dispose(): void {
    super.dispose();
  }
 
  precmd(prompt: string): void {
    const priorState = this.state;
    this.prompt = prompt;
    console.log("Storing prompt", prompt);
    this.state = ShellState.HANDLING_INPUT;
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
    this._onStateChange.fire({
      priorState: this.state,
      newState: this.state,
      action: ShellAction.CHPWD_HOOK
    });
  }

  startSuggestion() : void {
    console.log("Starting suggestion recording")
    const priorState = this.state;
    this.state = ShellState.ACCEPTING_SUGGESTION;
    this._onStateChange.fire({
      priorState: priorState,
      newState: this.state,
      action: ShellAction.START_SUGGESTION
    });
  }

  recordSuggestionChunk(suggestionChunk : string) : void {
    this.suggestionBuffer += suggestionChunk;

    // We take the reprinting of the prompt as the signal that the suggestion is done
    // Requries setopt NOALWAYS_LAST_PROMPT in zsh
    console.log("Prompt", this.prompt);
    console.log("Suggestion buffer", this.suggestionBuffer);
    const promptIdx = this.prompt ? this.suggestionBuffer.lastIndexOf(this.prompt) : -1;
    if (promptIdx >= 0) {
      this.suggestionBuffer = this.suggestionBuffer.slice(0, promptIdx);
      this.endSuggestion();
    }
  }

  endSuggestion() : void {
    console.log("Ending suggestion", this.suggestionBuffer);
    const priorState = this.state;
    this.state = ShellState.HANDLING_INPUT;
    this._onStateChange.fire({
      priorState: priorState,
      newState: this.state,
      action: ShellAction.END_SUGGESTION
    });
  }

  getSuggestions(): string[] {
    const suggestions = this.suggestionBuffer.split("\n");
    console.log(suggestions.length, "suggestions returned");
    return suggestions;
  }

}
