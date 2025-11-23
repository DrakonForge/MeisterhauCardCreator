
export const query = <T extends Element = HTMLElement>(selector: string): T | null => {
    const element = document.querySelector(selector) as T;
    if (!element) {
        console.warn(`Unable to find selector ${selector}`);
        return null;
    }
    return element;
}

export const queryAll = <T extends Element = HTMLElement>(selector: string): NodeListOf<T> | null => {
    const element = document.querySelectorAll<T>(selector);
    if (!element) {
        console.warn(`Unable to find selector ${selector}`);
        return null;
    }
    return element;
}

export const setText = (selector: string, value: string): boolean => {
    const element = query(selector);
    if (element && element.textContent !== value) {
        element.textContent = value;
        return true;
    }
    return false;
};

export const setImageUrl = (selector: string, path: string): boolean => {
    const element = query<HTMLImageElement>(selector);
    if (element) {
        element.src = path;
    }
    return false;
}

export const setBackgroundColor = (selector: string, value: string): void => {
    const element = query(selector);
    if (element) {
        element.style.backgroundColor = value;
    }
};

export const setTextColor = (selector: string, value: string): void => {
    const element = query(selector);
    if (element) {
        element.style.color = value;
    }
};

export const onClick = (selector: string, callback: (event: Event) => any): void => {
    return onEvent(selector, callback, "click");
};

export const onChange = (selector: string, callback: (event: Event) => any): void => {
    return onEvent(selector, callback, "change");
};

export const onEvent = (selector: string, callback: (event: Event) => any, event: string): void => {
    const element = query(selector);
    if (element) {
        element.addEventListener(event, (ev) => {
            return callback(ev);
        });
    }
}

export const getClassList = (selector: string): DOMTokenList | null => {
    const element = query(selector);
    if (element) {
        return element.classList;
    }
    return null;
}
