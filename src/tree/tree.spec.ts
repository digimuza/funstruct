import { Tree, TreeHooks } from './tree';

const RealDate = Date.now;

beforeAll(() => {
  global.Date.now = jest.fn(() => new Date('2019-04-07T10:20:30Z').getTime());
});

afterAll(() => {
  global.Date.now = RealDate;
});

function treeHooks(prefix: string = '') {
  let id = 0;
  return {
    generateId: () => prefix + (id++).toString(),
    onCreate: (q) => {
      return {
        ...q,
        meta: {
          ...q.meta,
          createdAt: Date.now(),
          author: 'Andrius',
        },
      };
    },
  } as TreeHooks<string, { author: string; createdAt: number; updatedAt: number }>;
}

describe('Tree tests', () => {
  test('Simple add operation', () => {
    const simpleTree = Tree.of('A', { hooks: treeHooks() });
    simpleTree.add('B');
    expect(simpleTree.toJSON()).toEqual({
      '0': {
        children: ['1'],
        id: '0',
        meta: {
          author: 'Andrius',
          createdAt: 1554632430000,
          updatedAt: 1554632430000,
        },
        resource: 'A',
      },
      '1': {
        id: '1',
        meta: {
          author: 'Andrius',
          createdAt: 1554632430000,
          updatedAt: 1554632430000,
        },
        parent: '0',
        resource: 'B',
      },
    });
  });

  test('Simple add with multiple paths', () => {
    const simpleTree = Tree.of('A', { hooks: treeHooks() });

    simpleTree.add('B');
    simpleTree.add('C').add('C1');
    simpleTree.add('D');

    expect(simpleTree.toJSON()).toEqual({
      '0': {
        id: '0',
        resource: 'A',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
        children: ['1', '2', '4'],
      },
      '1': {
        id: '1',
        parent: '0',
        resource: 'B',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
      },
      '2': {
        id: '2',
        parent: '0',
        resource: 'C',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
        children: ['3'],
      },
      '3': {
        id: '3',
        parent: '2',
        resource: 'C1',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
      },
      '4': {
        id: '4',
        parent: '0',
        resource: 'D',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
      },
    });
  });

  test('Simple add with multiple paths 5 level deep', () => {
    const simpleTree = Tree.of('A', { hooks: treeHooks() });
    const a1 = simpleTree.add('A1');
    a1.add('A1_1');
    a1.add('A1_2');
    const a1_3 = a1.add('A1_3');
    a1_3.add('A1_3_1');
    a1_3.add('A1_3_2');
    a1_3.add('A1_3_3');

    simpleTree.add('A2').add('A2_1').add('A2_1_1');
    simpleTree.add('A3');
    expect(simpleTree.toJSON()).toEqual({
      '0': {
        id: '0',
        resource: 'A',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },

        children: ['1', '8', '11'],
      },
      '1': {
        id: '1',
        parent: '0',
        resource: 'A1',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
        children: ['2', '3', '4'],
      },
      '2': {
        id: '2',
        parent: '1',
        resource: 'A1_1',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
      },
      '3': {
        id: '3',
        parent: '1',
        resource: 'A1_2',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
      },
      '4': {
        id: '4',
        parent: '1',
        resource: 'A1_3',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
        children: ['5', '6', '7'],
      },
      '5': {
        id: '5',
        parent: '4',
        resource: 'A1_3_1',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
      },
      '6': {
        id: '6',
        parent: '4',
        resource: 'A1_3_2',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
      },
      '7': {
        id: '7',
        parent: '4',
        resource: 'A1_3_3',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
      },
      '8': {
        id: '8',
        parent: '0',
        resource: 'A2',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
        children: ['9'],
      },
      '9': {
        id: '9',
        parent: '8',
        resource: 'A2_1',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
        children: ['10'],
      },
      '10': {
        id: '10',
        parent: '9',
        resource: 'A2_1_1',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
      },
      '11': {
        id: '11',
        parent: '0',
        resource: 'A3',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
      },
    });
  });

  test('Complex manipulations', () => {
    const simpleTree = Tree.of('A', { hooks: treeHooks() });
    // Add A1 node
    simpleTree.add('A1');

    const a2 = simpleTree.add('X1');
    a2.add('X2').add('X3');
    const clonedA2 = a2.clone({ hooks: treeHooks('a__') });
    // New tree from branch
    expect(clonedA2.toJSON()).toEqual({
      a__0: {
        id: 'a__0',
        parent: undefined,
        resource: 'X1',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
        children: ['a__1'],
      },
      a__1: {
        id: 'a__1',
        parent: 'a__0',
        resource: 'X2',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
        children: ['a__2'],
      },
      a__2: {
        id: 'a__2',
        parent: 'a__1',
        resource: 'X3',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
      },
    });
  });
  test('Flaten the tree', () => {
    const tree1 = Tree.of('Tree1', { hooks: treeHooks('Tree1') });

    tree1.add('A');
    tree1.add('B').add('C').add('D');
    tree1.add('E').add('F').add('G');

    expect(tree1.toFlat()).toEqual({
      meta: {
        createdAt: 1554632430000,
        author: 'Andrius',
        updatedAt: 1554632430000,
      },
      resource: 'Tree1',
      children: [
        {
          meta: {
            createdAt: 1554632430000,
            author: 'Andrius',
            updatedAt: 1554632430000,
          },
          resource: 'A',
          children: [],
        },
        {
          meta: {
            createdAt: 1554632430000,
            author: 'Andrius',
            updatedAt: 1554632430000,
          },
          resource: 'B',
          children: [
            {
              meta: {
                createdAt: 1554632430000,
                author: 'Andrius',
                updatedAt: 1554632430000,
              },
              resource: 'C',
              children: [
                {
                  meta: {
                    createdAt: 1554632430000,
                    author: 'Andrius',
                    updatedAt: 1554632430000,
                  },
                  resource: 'D',
                  children: [],
                },
              ],
            },
          ],
        },
        {
          meta: {
            createdAt: 1554632430000,
            author: 'Andrius',
            updatedAt: 1554632430000,
          },
          resource: 'E',
          children: [
            {
              meta: {
                createdAt: 1554632430000,
                author: 'Andrius',
                updatedAt: 1554632430000,
              },
              resource: 'F',
              children: [
                {
                  meta: {
                    createdAt: 1554632430000,
                    author: 'Andrius',
                    updatedAt: 1554632430000,
                  },
                  resource: 'G',
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    });
  });
  test('Merge two trees', () => {
    const tree1 = Tree.of('Tree1', { hooks: treeHooks('Tree1') });
    const tree2 = Tree.of('Tree2', { hooks: treeHooks('Tree2') });
    // Add A1 node
    const sp = tree1.add('A1').add('A2');
    sp.add('A3');
    sp.add('A4');
    sp.add('A5');
    sp.add('A6');
    tree2.add('B1').add('B2').merge(tree1);
    expect(tree2.toJSON()).toEqual({
      Tree20: {
        id: 'Tree20',
        resource: 'Tree2',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },

        children: ['Tree21'],
      },
      Tree21: {
        id: 'Tree21',
        parent: 'Tree20',
        resource: 'B1',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
        children: ['Tree22'],
      },
      Tree22: {
        id: 'Tree22',
        parent: 'Tree21',
        resource: 'B2',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
        children: ['Tree23'],
      },
      Tree23: {
        id: 'Tree23',
        resource: 'Tree1',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
        children: ['Tree24'],
        parent: 'Tree22',
      },
      Tree24: {
        id: 'Tree24',
        parent: 'Tree23',
        resource: 'A1',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
        children: ['Tree25'],
      },
      Tree25: {
        id: 'Tree25',
        parent: 'Tree24',
        resource: 'A2',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
        children: ['Tree26', 'Tree27', 'Tree28', 'Tree29'],
      },
      Tree26: {
        id: 'Tree26',
        parent: 'Tree25',
        resource: 'A3',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
      },
      Tree27: {
        id: 'Tree27',
        parent: 'Tree25',
        resource: 'A4',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
      },
      Tree28: {
        id: 'Tree28',
        parent: 'Tree25',
        resource: 'A5',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
      },
      Tree29: {
        id: 'Tree29',
        parent: 'Tree25',
        resource: 'A6',
        meta: {
          createdAt: 1554632430000,
          author: 'Andrius',
          updatedAt: 1554632430000,
        },
      },
    });
  });
});
