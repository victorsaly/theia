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

// tslint:disable:no-any

import { ResponseError } from 'vscode-jsonrpc/lib/messages';

export namespace ApplicationError {
    type Codes = [number, number, string];
    const reservedCodes: Codes[] = [
        [-32768, -32000, 'JSON-RPC pre-defined']
    ];
    function checkCode([from, to]: Codes, code: number): boolean {
        return from >= code && code <= to;
    }
    export interface Literal<D> {
        message: string,
        data?: D
    }
    export interface Fn<D, C extends number> {
        (...args: any[]): ResponseError<D>;
        code: C;
        is(arg: object | undefined): arg is ResponseError<D>
    }
    function define<D, C extends number>(code: C, factory: (...args: any[]) => Literal<D>): Fn<D, C> {
        return Object.assign((...args: any[]) => {
            const { message, data } = factory(...args);
            return new ResponseError(code, message, data);
        }, {
                code,
                is(arg: object | undefined): arg is ResponseError<D> {
                    return arg instanceof ResponseError && arg.code === code;
                }
            });
    }
    export function reserve(from: number, to: number, owner: string): <D, C extends number>(code: C, factory: (...args: any[]) => Literal<D>) => Fn<D, C> {
        reservedCodes.forEach(reserved => {
            if (!checkCode(reserved, from) || !checkCode(reserved, to)) {
                throw new Error(`Error codes from ${reserved[0]} to ${reserved[1]} are reserverd for ${reserved[2]} errors.`);
            }
        });
        const codes: Codes = [from, to, owner];
        reservedCodes.push(codes);
        return (code, factory) => {
            if (!checkCode(codes, from)) {
                throw new Error(`${code} shoud be between ${from} and ${to} for ${owner} errors.`);
            }
            return define(code, factory);
        };
    }
}
