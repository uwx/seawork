import Reconciler, { type OpaqueRoot } from "react-reconciler";
import { InternalHostConfig } from "./HostConfig";
import type { Container } from "./types";
import { ConcurrentRoot } from "react-reconciler/constants.js";
import EventEmitter from "node:events";
import type TypedEmitter from "typed-emitter"
import { createElement, Fragment } from "react";

export const reconciler = Reconciler(InternalHostConfig);

export type InternalReactRendererEvents = {
    render: (container: Container) => void;
    renderError: (e: Error) => void;
    containerUpdated: () => void;
};

export class InternalReactRenderer extends (EventEmitter as new () => TypedEmitter<InternalReactRendererEvents>) {
    container: Container;
    root: OpaqueRoot;

    constructor() {
        super();

        this.container = {
            node: null,
            onRender: () => this.emit("render", this.container),
        };

        this.root = reconciler.createContainer(
            this.container,
            ConcurrentRoot,
            null,
            false,
            null,
            "",
            (e) => this.emit("renderError", e),
            null
        );
    }

    setRenderedNode(node: React.ReactNode) {
        reconciler.updateContainer(node, this.root, null, () => {
            this.emit("containerUpdated");
        });
    }

    stop() {
        // ?
        this.setRenderedNode(createElement(Fragment));
    }

    static renderOnce(node: React.ReactNode) {
        return new Promise((res) => {
            let renderer = new InternalReactRenderer();
            renderer.on("render", (continer) => {
                res(continer.node);
            });
            renderer.setRenderedNode(node);
        });
    }
};
