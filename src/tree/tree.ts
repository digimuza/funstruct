function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface TreeHooks<
  Resource,
  Meta extends Record<string, unknown> = {
    [k: string]: any;
    createdAt: number;
    updatedAt: number;
  }
> {
  generateId?: () => string;
  onUpdate?: (
    prev: PlainNode<Resource, Meta>,
    current: PlainNode<Resource, Meta>,
    tree: Map<string, PlainNode<Resource, Meta>>
  ) => PlainNode<Resource, Meta>;
  onCreate?: (
    branch: PlainNode<Resource, Meta>,
    tree: Map<string, PlainNode<Resource, Meta>>
  ) => PlainNode<Resource, Meta>;
  onDelete?: (
    branch: PlainNode<Resource, Meta>,
    tree: Map<string, PlainNode<Resource, Meta>>
  ) => void;
}

export interface PlainNode<
  T,
  Meta extends Record<string, unknown>
> {
  id: string;
  parent?: string;
  resource: T;
  children?: ReadonlyArray<string>;
  meta?: Partial<Meta>;
}

export type PlainTree<
  T,
  Meta extends Record<string, unknown>
> = Record<string, PlainNode<T, Meta>>;

export class Tree<
  Resource,
  Meta extends Record<string, unknown>
> {
  private hooks: TreeHooks<Resource, Meta>;
  private readonly id: string;

  static of<
    T,
    M extends { [k: string]: any; createdAt: number; updatedAt: number } = {
      createdAt: number;
      updatedAt: number;
    }
  >(data: T, options?: { hooks?: TreeHooks<T, M> }) {
    return new Tree(
      new Map(),
      {
        id: options?.hooks?.generateId?.() || uuidv4(),
        resource: data,
      },
      options
    );
  }
  static from<T, Meta extends Record<string, unknown>>(
    tree: Map<string, PlainNode<T, Meta>> | Record<string, PlainNode<T, Meta>>,
    options?: { hooks?: TreeHooks<T, Meta> }
  ) {
    const normalized =
      tree instanceof Map ? tree : new Map(Object.entries(tree));
    for (const [_, node] of normalized) {
      if (node.parent == null) return new Tree(normalized, node, options);
    }
    throw new Error('Failed to find entry point');
  }

  constructor(
    private _tree: Map<string, PlainNode<Resource, Meta>>,
    initialNode: PlainNode<Resource, Meta>,
    options?: {
      hooks?: TreeHooks<Resource, Meta>;
    }
  ) {
    this.hooks = options?.hooks || {};
    this.id = initialNode.id;
    this.__createOrUpdateNode(initialNode);
  }
  get parent(): Tree<Resource, Meta> {
    const parentId = this.plain.parent;
    if (parentId == null) return this;
    const parrent = this.goTo(parentId);
    if (parrent == null) {
      throw new Error(
        `Corrupted tree. Failed to find parrent node with id ${parentId}`
      );
    }
    return parrent;
  }

  get children(): ReadonlyArray<Tree<Resource, Meta>> {
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
      .filter((q): q is Tree<Resource, Meta> => !!q);
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

  get plain(): PlainNode<Resource, Meta> {
    const x = this.tree.get(this.id);
    if (x == null) {
      throw new Error('Item does not exsist in tree. Critical error');
    }
    return x;
  }
  get meta(): Partial<Meta> | undefined {
    return this.plain.meta;
  }
  get resource(): Resource {
    return this.plain.resource;
  }
  set resource(res) {
    this.__createOrUpdateNode({
      ...this.plain,
      resource: res,
    });
  }

  private __generateId(): string {
    return (this.hooks.generateId || uuidv4)();
  }
  private __onCreate(
    resource: PlainNode<Resource, Meta>
  ): PlainNode<Resource, Meta> {
    if (this.hooks.onCreate) {
      return this.hooks.onCreate(resource, this.tree);
    }
    return {
      ...resource,
      meta: {
        ...resource.meta,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as Partial<Meta>,
    };
  }
  private __createOrUpdateNode(resource: PlainNode<Resource, Meta>) {
    const nodeExists = this.tree.get(resource.id);
    if (nodeExists == null) {
      return this.tree.set(resource.id, this.__onCreate(resource));
    }

    if (this.hooks.onUpdate) {
      return this.tree.set(
        resource.id,
        this.hooks.onUpdate(nodeExists, resource, this.tree)
      );
    }

    return this.tree.set(resource.id, {
      ...resource,
      meta: { ...resource.meta, updatedAt: Date.now() } as Partial<Meta>,
    });
  }

  merge(tree: Tree<Resource, Meta>) {
    const clonedTree = tree.clone({ hooks: this.hooks });
    const rootLeaf = clonedTree.root;
    this.tree.set(this.id, {
      ...this.plain,
      children: Array.from(
        new Set([rootLeaf.plain.id, ...(this.plain.children || [])])
      ),
    });
    clonedTree.tree.set(rootLeaf.id, {
      ...rootLeaf.plain,
      parent: this.id,
    });

    for (const [k, v] of clonedTree.tree) {
      this.tree.set(k, v);
    }
  }

  goTo(id: string): Tree<Resource, Meta> | undefined {
    const node = this.tree.get(id);
    if (node == null) return;
    return new Tree(this.tree, node, { hooks: this.hooks });
  }

  /**
   * Adds child to current node
   * @param resource
   */
  add(resource: Resource, meta?: Partial<Meta>) {
    const newItemId = this.__generateId();
    const thisNode = this.plain;
    this.__createOrUpdateNode({
      ...thisNode,
      children: Array.from(new Set([...(thisNode.children || []), newItemId])),
    });

    const newNode = {
      id: newItemId,
      parent: this.id,
      resource: resource,
      meta,
    };

    this.__createOrUpdateNode(newNode);
    const createdNode = this.goTo(newItemId);
    if (createdNode == null) {
      throw new Error(
        'Corner case bug, this bug should never ocur in normal circumstances. Something is realy wrong with current enviroment.'
      );
    }
    return createdNode;
  }

  /**
   * Removes node and it's child from tree
   */
  remove() {
    const item = this.tree.get(this.id);
    if (item == null) return;
    this.children.forEach((q) => q.remove());
    this.hooks?.onDelete?.(item, this.tree);
    this.tree.delete(this.id);
  }

  /**
   * Clone and creates new tree from this node and download.
   * All node ids will be regenerated
   */
  clone(options?: { hooks?: TreeHooks<Resource, Meta> }) {
    const newTree = new Map<string, PlainNode<Resource, Meta>>();
    const recursive = (
      node: PlainNode<Resource, Meta>,
      tree?: Tree<Resource, Meta>
    ): Tree<Resource, Meta> => {
      if (tree) {
        const parrent = tree.add(node.resource, node.meta);
        if (node.children == null) return tree;
        for (const child of node.children) {
          const w = this.tree.get(child);
          if (w == null) continue;
          recursive(w, parrent);
        }
        return tree;
      }
      const genId = options?.hooks?.generateId || uuidv4;
      const created = new Tree(
        newTree,
        { ...this.plain, id: genId(), children: undefined, parent: undefined },
        options
      );
      if (this.plain.children == null) return created;
      for (const child of this.plain.children) {
        const w = this.tree.get(child);
        if (w == null) continue;
        recursive(w, created);
      }
      return created;
    };
    return recursive(this.plain);
  }
  find(
    fn: (
      branch: PlainNode<Resource, Meta>,
      id: string,
      tree: Map<string, PlainNode<Resource, Meta>>
    ) => boolean
  ): Tree<Resource, Meta> | undefined {
    for (const [id, value] of this.tree) {
      const result = fn(value, id, this.tree);
      if (!result) continue;

      const go = this.goTo(id);
      if (go == null) {
        throw new Error('Critical Error');
      }
      return go;
    }
    return;
  }
  toFlat(): FlatTree<Resource, Meta> {
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
    }, {} as Record<string, PlainNode<Resource, Meta>>);
  }
}

export type FlatTree<T, M> = {
  resource: T;
  meta?: Partial<M>;
  children: ReadonlyArray<FlatTree<T, M>>;
};
