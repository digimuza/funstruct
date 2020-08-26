export interface TreeHooks<Resource, Meta extends Record<string, unknown> = {
    [k: string]: any;
    createdAt: number;
    updatedAt: number;
}> {
    generateId?: () => string;
    onUpdate?: (prev: PlainNode<Resource, Meta>, current: PlainNode<Resource, Meta>, tree: Map<string, PlainNode<Resource, Meta>>) => PlainNode<Resource, Meta>;
    onCreate?: (branch: PlainNode<Resource, Meta>, tree: Map<string, PlainNode<Resource, Meta>>) => PlainNode<Resource, Meta>;
    onDelete?: (branch: PlainNode<Resource, Meta>, tree: Map<string, PlainNode<Resource, Meta>>) => void;
}
export interface PlainNode<T, Meta extends Record<string, unknown>> {
    id: string;
    parent?: string;
    resource: T;
    children?: ReadonlyArray<string>;
    meta?: Partial<Meta>;
}
export declare type PlainTree<T, Meta extends Record<string, unknown>> = Record<string, PlainNode<T, Meta>>;
export declare class Tree<Resource, Meta extends Record<string, unknown>> {
    private _tree;
    private hooks;
    private readonly id;
    static of<T, M extends {
        [k: string]: any;
        createdAt: number;
        updatedAt: number;
    } = {
        createdAt: number;
        updatedAt: number;
    }>(data: T, options?: {
        hooks?: TreeHooks<T, M>;
    }): Tree<T, M>;
    static from<T, Meta extends Record<string, unknown>>(tree: Map<string, PlainNode<T, Meta>> | Record<string, PlainNode<T, Meta>>, options?: {
        hooks?: TreeHooks<T, Meta>;
    }): Tree<T, Meta>;
    constructor(_tree: Map<string, PlainNode<Resource, Meta>>, initialNode: PlainNode<Resource, Meta>, options?: {
        hooks?: TreeHooks<Resource, Meta>;
    });
    get parent(): Tree<Resource, Meta>;
    get children(): ReadonlyArray<Tree<Resource, Meta>>;
    get tree(): Map<string, PlainNode<Resource, Meta>>;
    get root(): Tree<Resource, Meta>;
    get plain(): PlainNode<Resource, Meta>;
    get meta(): Partial<Meta> | undefined;
    get resource(): Resource;
    set resource(res: Resource);
    private __generateId;
    private __onCreate;
    private __createOrUpdateNode;
    merge(tree: Tree<Resource, Meta>): void;
    goTo(id: string): Tree<Resource, Meta> | undefined;
    /**
     * Adds child to current node
     * @param resource
     */
    add(resource: Resource, meta?: Partial<Meta>): Tree<Resource, Meta>;
    /**
     * Removes node and it's child from tree
     */
    remove(): void;
    /**
     * Clone and creates new tree from this node and download.
     * All node ids will be regenerated
     */
    clone(options?: {
        hooks?: TreeHooks<Resource, Meta>;
    }): Tree<Resource, Meta>;
    find(fn: (branch: PlainNode<Resource, Meta>, id: string, tree: Map<string, PlainNode<Resource, Meta>>) => boolean): Tree<Resource, Meta> | undefined;
    toFlat(): FlatTree<Resource, Meta>;
    toJSON(): Record<string, PlainNode<Resource, Meta>>;
}
export declare type FlatTree<T, M> = {
    resource: T;
    meta?: Partial<M>;
    children: ReadonlyArray<FlatTree<T, M>>;
};
//# sourceMappingURL=tree.d.ts.map