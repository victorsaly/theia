/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
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

import { inject, injectable } from 'inversify';
import { ILogger } from '../common/logger';
import { MessageService } from '../common/message-service';

export const StorageService = Symbol('IStorageService');
/**
 * The storage service provides an interface to some data storage that allows extensions to keep state among sessions.
 */
export interface StorageService {

    /**
     * Stores the given data under the given key.
     */
    setData<T>(key: string, data: T): Promise<void>;

    /**
     * Returns the data stored for the given key or the provided default value if nothing is stored for the given key.
     */
    getData<T>(key: string, defaultValue: T): Promise<T>;
    getData<T>(key: string): Promise<T | undefined>;
}

interface LocalStorage {
    // tslint:disable-next-line:no-any
    [key: string]: any;
}

@injectable()
export class LocalStorageService implements StorageService {
    private storage: LocalStorage;

    constructor(
        @inject(ILogger) protected logger: ILogger,
        @inject(MessageService) protected readonly messageService: MessageService,

    ) {
        if (typeof window !== 'undefined' && window.localStorage) {
            this.storage = window.localStorage;
            this.testLocalStorage();
        } else {
            logger.warn(log => log("The browser doesn't support localStorage. state will not be persisted across sessions."));
            this.storage = {};
        }
    }

    setData<T>(key: string, data?: T): Promise<void> {
        if (data !== undefined) {
            try {
                this.storage[this.prefix(key)] = JSON.stringify(data);
            } catch (e) {
                this.ShowMessageNotification();
            }
        } else {
            delete this.storage[this.prefix(key)];
        }
        return Promise.resolve();
    }

    getData<T>(key: string, defaultValue?: T): Promise<T | undefined> {
        const result = this.storage[this.prefix(key)];
        if (result === undefined) {
            return Promise.resolve(defaultValue);
        }
        return Promise.resolve(JSON.parse(result));
    }

    protected prefix(key: string): string {
        const pathname = typeof window === 'undefined' ? '' : window.location.pathname;
        return `theia:${pathname}:${key}`;
    }

    private ShowMessageNotification() {
        const READ_INSTRUCTIONS_ACTION = "Read Instructions";
        const ERROR_MESSAGE = `Your prefered browser local storage is almost full.
            To be able to save your current workspace layout or data, you may need to free some space.
            You can refer to Theia page for instructions.
            on how to manually clean your browser local storage.`;
        this.messageService.warn(ERROR_MESSAGE, READ_INSTRUCTIONS_ACTION).then(selected => {
            if (READ_INSTRUCTIONS_ACTION === selected) {
                window.open("https://github.com/theia-ide/theia/wiki/Cleaning-Local-Storage");
            }
        });
    }

    private testLocalStorage(): void {
        const array = new Array(60000); // size: <array size> * 5 =  ~ 300K
        const keyTest = this.prefix(`Test`);

        try {
            this.storage[keyTest] = JSON.stringify(array);
        } catch (error) {
            this.ShowMessageNotification();
        } finally {
            this.storage.removeItem(keyTest);
        }
    }

}
