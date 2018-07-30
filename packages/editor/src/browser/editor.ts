/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { Position, Range } from 'vscode-languageserver-types';
import * as lsp from 'vscode-languageserver-types';
import URI from "@theia/core/lib/common/uri";
import { Event, Disposable } from '@theia/core/lib/common';
import { Saveable, Navigatable } from '@theia/core/lib/browser';
import { EditorDecoration } from './decorations';

export {
    Position, Range
};

export const TextEditorProvider = Symbol('TextEditorProvider');
export type TextEditorProvider = (uri: URI) => Promise<TextEditor>;

export interface TextEditorDocument extends lsp.TextDocument, Saveable, Disposable {
    getLineContent(lineNumber: number): string;
}

export interface TextDocumentContentChangeDelta extends lsp.TextDocumentContentChangeEvent {
    readonly range: Range;
    readonly rangeLength: number;
}

export namespace TextDocumentContentChangeDelta {

    // tslint:disable-next-line:no-any
    export function is(arg: any): arg is TextDocumentContentChangeDelta {
        return !!arg && typeof arg['text'] === 'string' && typeof arg['rangeLength'] === 'number' && Range.is(arg['range']);
    }

}

export interface TextDocumentChangeEvent {
    readonly document: TextEditorDocument;
    readonly contentChanges: TextDocumentContentChangeDelta[];
}

export interface TextEditor extends Disposable, TextEditorSelection, Navigatable {
    readonly node: HTMLElement;

    readonly uri: URI;
    readonly document: TextEditorDocument;
    readonly onDocumentContentChanged: Event<TextDocumentChangeEvent>;

    cursor: Position;
    readonly onCursorPositionChanged: Event<Position>;

    selection: Range;
    readonly onSelectionChanged: Event<Range>;

    focus(): void;
    blur(): void;
    isFocused(): boolean;
    readonly onFocusChanged: Event<boolean>;

    revealPosition(position: Position, options?: RevealPositionOptions): void;
    revealRange(range: Range, options?: RevealRangeOptions): void;

    /**
     * Rerender the editor.
     */
    refresh(): void;
    /**
     * Resize the editor to fit its node.
     */
    resizeToFit(): void;
    setSize(size: Dimension): void;

    /**
     * Applies given new decorations, and removes old decorations identified by ids.
     *
     * @returns identifiers of applied decorations, which can be removed in next call.
     */
    deltaDecorations(params: DeltaDecorationParams): string[];

    /**
     * Get the range associated with a decoration.
     * @param id The decoration id.
     * @return The decoration range or `undefined` if the decoration was not found.
     */
    getDecorationRange(id: string): Range | undefined;

    /**
     * Gets all the decorations in a range as an array. Only `start.line` and `end.line` from `range` are used for filtering.
     * So for now it returns all the decorations on the same line as `range`.
     * @param range The range to search in.
     * @return An array with the decorations.
     */
    getDecorationsInRange(range: Range): EditorDecoration[];

    /**
     * Gets all the decorations for the lines between `startLineNumber` and `endLineNumber` as an array.
     * @param startLineNumber The start line number.
     * @param endLineNumber The end line number.
     * @return An array with the decorations.
     */
    getLinesDecorations(startLineNumber: number, endLineNumber: number): EditorDecoration[];

    getVisibleColumn(position: Position): number;

    /**
     * Replaces the text of source given in ReplaceTextParams.
     * @param params: ReplaceTextParams
     */
    replaceText(params: ReplaceTextParams): Promise<boolean>;

    /**
     * Execute edits on the editor.
     * @param edits: edits created with `lsp.TextEdit.replace`, `lsp.TextEdit.insert`, `lsp.TextEdit.del`
     */
    executeEdits(edits: lsp.TextEdit[]): boolean;
}

export interface Dimension {
    width: number;
    height: number;
}

export interface TextEditorSelection {
    uri: URI
    cursor?: Position
    selection?: Range
}

export interface RevealPositionOptions {
    vertical: 'auto' | 'center' | 'centerIfOutsideViewport';
    horizontal?: boolean;
}

export interface RevealRangeOptions {
    at: 'auto' | 'center' | 'top' | 'centerIfOutsideViewport';
}

export interface DeltaDecorationParams {
    oldDecorations: string[];
    newDecorations: EditorDecoration[];
}

export interface ReplaceTextParams {
    /**
     * the source to edit
     */
    source: string;
    /**
     * the replace operations
     */
    replaceOperations: ReplaceOperation[];
}

export interface ReplaceOperation {
    /**
     * the position that shall be replaced
     */
    range: Range;
    /**
     * the text to replace with
     */
    text: string;
}

export namespace TextEditorSelection {
    // tslint:disable-next-line:no-any
    export function is(e: any): e is TextEditorSelection {
        return e && e["uri"] instanceof URI;
    }
}
