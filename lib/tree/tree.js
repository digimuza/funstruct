"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tree = void 0;
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0, v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
class Tree {
    constructor(_tree, initialNode, options) {
        this._tree = _tree;
        this.hooks = (options === null || options === void 0 ? void 0 : options.hooks) || {};
        this.id = initialNode.id;
        this.__createOrUpdateNode(initialNode);
    }
    static of(data, options) {
        var _a, _b;
        return new Tree(new Map(), {
            id: ((_b = (_a = options === null || options === void 0 ? void 0 : options.hooks) === null || _a === void 0 ? void 0 : _a.generateId) === null || _b === void 0 ? void 0 : _b.call(_a)) || uuidv4(),
            resource: data,
        }, options);
    }
    static from(tree, options) {
        const normalized = tree instanceof Map ? tree : new Map(Object.entries(tree));
        for (const [_, node] of normalized) {
            if (node.parent == null)
                return new Tree(normalized, node, options);
        }
        throw new Error('Failed to find entry point');
    }
    get parent() {
        const parentId = this.plain.parent;
        if (parentId == null)
            return this;
        const parrent = this.goTo(parentId);
        if (parrent == null) {
            throw new Error(`Corrupted tree. Failed to find parrent node with id ${parentId}`);
        }
        return parrent;
    }
    get children() {
        const node = this.tree.get(this.id);
        if (node == null) {
            throw new Error(`Failed to find current node id. This is critical bug`);
        }
        return (node.children || [])
            .map((id) => {
            const xNode = this.goTo(id);
            if (xNode == null) {
                return;
            }
            return xNode;
        })
            .filter((q) => !!q);
    }
    get tree() {
        return this._tree;
    }
    get root() {
        const rootNode = this.find((q) => q.parent == null);
        if (rootNode == null) {
            throw new Error('Failed to find rootNode. Broken tree');
        }
        return rootNode;
    }
    get plain() {
        const x = this.tree.get(this.id);
        if (x == null) {
            throw new Error('Item does not exsist in tree. Critical error');
        }
        return x;
    }
    get meta() {
        return this.plain.meta;
    }
    get resource() {
        return this.plain.resource;
    }
    set resource(res) {
        this.__createOrUpdateNode(Object.assign(Object.assign({}, this.plain), { resource: res }));
    }
    __generateId() {
        return (this.hooks.generateId || uuidv4)();
    }
    __onCreate(resource) {
        if (this.hooks.onCreate) {
            return this.hooks.onCreate(resource, this.tree);
        }
        return Object.assign(Object.assign({}, resource), { meta: Object.assign(Object.assign({}, resource.meta), { createdAt: Date.now(), updatedAt: Date.now() }) });
    }
    __createOrUpdateNode(resource) {
        const nodeExists = this.tree.get(resource.id);
        if (nodeExists == null) {
            return this.tree.set(resource.id, this.__onCreate(resource));
        }
        if (this.hooks.onUpdate) {
            return this.tree.set(resource.id, this.hooks.onUpdate(nodeExists, resource, this.tree));
        }
        return this.tree.set(resource.id, Object.assign(Object.assign({}, resource), { meta: Object.assign(Object.assign({}, resource.meta), { updatedAt: Date.now() }) }));
    }
    merge(tree) {
        const clonedTree = tree.clone({ hooks: this.hooks });
        const rootLeaf = clonedTree.root;
        this.tree.set(this.id, Object.assign(Object.assign({}, this.plain), { children: Array.from(new Set([rootLeaf.plain.id, ...(this.plain.children || [])])) }));
        clonedTree.tree.set(rootLeaf.id, Object.assign(Object.assign({}, rootLeaf.plain), { parent: this.id }));
        for (const [k, v] of clonedTree.tree) {
            this.tree.set(k, v);
        }
    }
    goTo(id) {
        const node = this.tree.get(id);
        if (node == null)
            return;
        return new Tree(this.tree, node, { hooks: this.hooks });
    }
    /**
     * Adds child to current node
     * @param resource
     */
    add(resource, meta) {
        const newItemId = this.__generateId();
        const thisNode = this.plain;
        this.__createOrUpdateNode(Object.assign(Object.assign({}, thisNode), { children: Array.from(new Set([...(thisNode.children || []), newItemId])) }));
        const newNode = {
            id: newItemId,
            parent: this.id,
            resource: resource,
            meta,
        };
        this.__createOrUpdateNode(newNode);
        const createdNode = this.goTo(newItemId);
        if (createdNode == null) {
            throw new Error('Corner case bug, this bug should never ocur in normal circumstances. Something is realy wrong with current enviroment.');
        }
        return createdNode;
    }
    /**
     * Removes node and it's child from tree
     */
    remove() {
        var _a, _b;
        const item = this.tree.get(this.id);
        if (item == null)
            return;
        this.children.forEach((q) => q.remove());
        (_b = (_a = this.hooks) === null || _a === void 0 ? void 0 : _a.onDelete) === null || _b === void 0 ? void 0 : _b.call(_a, item, this.tree);
        this.tree.delete(this.id);
    }
    /**
     * Clone and creates new tree from this node and download.
     * All node ids will be regenerated
     */
    clone(options) {
        const newTree = new Map();
        const recursive = (node, tree) => {
            var _a;
            if (tree) {
                const parrent = tree.add(node.resource, node.meta);
                if (node.children == null)
                    return tree;
                for (const child of node.children) {
                    const w = this.tree.get(child);
                    if (w == null)
                        continue;
                    recursive(w, parrent);
                }
                return tree;
            }
            const genId = ((_a = options === null || options === void 0 ? void 0 : options.hooks) === null || _a === void 0 ? void 0 : _a.generateId) || uuidv4;
            const created = new Tree(newTree, Object.assign(Object.assign({}, this.plain), { id: genId(), children: undefined, parent: undefined }), options);
            if (this.plain.children == null)
                return created;
            for (const child of this.plain.children) {
                const w = this.tree.get(child);
                if (w == null)
                    continue;
                recursive(w, created);
            }
            return created;
        };
        return recursive(this.plain);
    }
    find(fn) {
        for (const [id, value] of this.tree) {
            const result = fn(value, id, this.tree);
            if (!result)
                continue;
            const go = this.goTo(id);
            if (go == null) {
                throw new Error('Critical Error');
            }
            return go;
        }
        return;
    }
    toFlat() {
        return {
            meta: this.meta,
            resource: this.resource,
            children: this.children.map((q) => {
                return q.toFlat();
            }),
        };
    }
    toJSON() {
        return Array.from(this.tree).reduce((acc, [key, node]) => {
            acc[key] = node;
            return acc;
        }, {});
    }
}
exports.Tree = Tree;
