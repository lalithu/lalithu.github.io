---
layout: page
title: Notes
permalink: /notes/
---

<div id="notes" class="section-anchor"></div>


Some of the classes I have enjoyed the most at UNC Charlotte are also classes I have had the opportunity to come back to as a Teaching Assistant.

This page is a living collection of the concepts, explanations, study notes, technical details, and little things that stuck with me from those courses. It is not meant to replace lectures, assignments, or official course material. It is more of a place for the ideas I found important, the topics I have had to revisit or explain repeatedly, and the connections that made the material click for me.

Most of these notes try to answer three questions:

- **What is this?**
- **How does it connect to everything else?**
- **What detail is easy to misunderstand or forget?**

Right now, this collection focuses on three areas I have especially enjoyed: **computer systems, data structures & algorithms, and introductory programming.**

### Jump to a course

- [ITSC 2181 — Introduction to Computer Systems](#itsc-2181)
- [ITSC 2214 — Data Structures & Algorithms](#itsc-2214)
- [ITSC 1212 / 1213 — Introduction to Computer Science I & II](#itsc-1212-1213)

---

<div id="itsc-2181" class="section-anchor"></div>

# ITSC 2181 — Introduction to Computer Systems

**TA'd for Zane Hutchens** 

**Focus:** C/C++, compilation, memory, processes, threads, concurrency, and the systems underneath our programs

2181 is one of the classes I have enjoyed most because it starts peeling away the abstractions we rely on when writing higher-level programs. Instead of only asking whether a program works, you start asking what is happening underneath it: where data lives, what a pointer actually represents, how a program becomes a running process, what threads share, and why two individually correct pieces of code can still interact incorrectly when they run concurrently.

A lot of ideas that feel mysterious in higher-level programming become much easier to reason about once you understand the systems underneath them.

## Technical bites

### A program is not a process

A **program** is a set of instructions stored as an executable file. A **process** is a running instance of that program with its own execution state and resources.

Running the same executable twice can create two different processes.

```text
program on disk
      ↓
loaded by the operating system
      ↓
running process
```

### Compilation is only one part of getting code to run

Source code does not jump directly from a `.cpp` file to the CPU.

A simplified view is:

```text
source code
    ↓
preprocessing
    ↓
compilation
    ↓
object files
    ↓
linking
    ↓
executable
    ↓
OS loads process
    ↓
CPU executes instructions
```

Compilation translates source into lower-level instructions, while linking resolves code and symbols that may live across multiple object files or libraries.

### A pointer is a value too

A pointer is a variable whose value represents the address of another object or region of memory.

```cpp
int x = 10;
int* p = &x;
```

Here:

```text
x  → stores 10
p  → stores the address of x
*p → accesses the value at that address
```

The distinction between a **value**, an **address**, and the **value stored at an address** is one of the most important mental models in systems programming.

### Stack and heap describe different kinds of storage

Function calls typically create stack frames that contain execution-related state such as local variables, parameters, and return information.

Dynamically allocated memory comes from a different region and must be managed according to the language and runtime being used.

A useful mental model:

```text
PROCESS MEMORY

high addresses
┌────────────────────┐
│       stack        │
│         ↓          │
│                    │
│         ↑          │
│        heap        │
├────────────────────┤
│ static/global data │
├────────────────────┤
│        code        │
└────────────────────┘
low addresses
```

The exact layout is platform-dependent, but the important idea is that not all program data has the same lifetime or storage behavior.

### Threads share a process, but each thread still has its own execution state

Threads in the same process share resources such as the process address space, but each thread needs its own independent execution context.

Conceptually:

```text
PROCESS
├── code
├── global/static data
├── heap
│
├── Thread 1
│   └── stack
│
├── Thread 2
│   └── stack
│
└── Thread 3
    └── stack
```

That combination — **shared data + independent execution** — is what makes multithreading both useful and dangerous.

### `pthread_create()` starts another flow of execution

A POSIX thread function has the general form:

```cpp
void* worker(void* arg)
```

A thread is created with a start routine, and the operating system/runtime may schedule that thread independently from the thread that created it.

The key takeaway is that after multiple threads exist, you generally should **not assume a particular execution order unless your program explicitly synchronizes them.**

### Concurrency creates bugs that sequential code cannot

Consider two threads both doing:

```text
counter = counter + 1
```

That looks like one operation in source code, but conceptually it involves:

```text
read counter
add 1
write counter
```

If two threads interleave those steps, an update can be lost.

That is a **race condition**: the result depends on timing or execution order.

### Mutexes protect critical sections

A **critical section** is a region of code where shared state must be accessed in a controlled way.

A mutex lets one thread enter that protected region at a time.

```text
Thread A: lock ── modify shared data ── unlock

Thread B:          waits...
                  lock ── modify ── unlock
```

The point of synchronization is not to make threads run in a particular aesthetic order. It is to preserve correctness when execution overlaps.

## Notes I want to keep building here

- Program vs. process vs. thread
- What actually happens when you compile a C/C++ program
- Pointers: values, addresses, and dereferencing
- Stack vs. heap
- Pass-by-value and pointer-based mutation
- Arrays and pointer arithmetic
- Structs and memory layout
- Processes and process creation
- POSIX threads and `pthread_create()`
- `pthread_join()` and thread lifetime
- Race conditions
- Critical sections
- Mutexes and synchronization
- Why thread execution order is not guaranteed
- Context switching
- Common segmentation fault causes
- Debugging memory and concurrency problems

### One idea I keep coming back to

Computer systems makes a lot more sense when you stop treating memory, processes, and threads as vocabulary words and start drawing what exists at runtime.

If I cannot sketch where the data is, who owns it, and which execution context can access it, I probably do not understand the program yet.

[Back to course index](#notes)

---

<div id="itsc-2214" class="section-anchor"></div>

# ITSC 2214 — Data Structures & Algorithms

**TA'd for Dr. Dale-Marie Wilson**   

**Focus:** Java, complexity, collections, linked structures, recursion, trees, hashing, graphs, and algorithmic thinking

2214 is one of the classes that really changed how I thought about programming. Earlier programming courses are often centered around getting a program to produce the correct result. Data Structures & Algorithms adds another layer: **how should the data be represented, what operations need to be efficient, and how does the solution behave as the problem gets larger?**

The interesting part is that there usually is not one universally best data structure. Choosing one means making tradeoffs.

A recurring pattern I have noticed while working with 2214 is that difficulty with data structures often traces back to gaps in Java fundamentals. References, object behavior, recursion, control flow, method calls, and the way data moves through a program show up everywhere.

That is why I originally built the Java & DSA knowledge map below.

## Technical bites

### Big-O describes growth, not seconds

`O(n)` does **not** mean an algorithm takes `n` seconds.

It describes how the amount of work grows relative to the size of the input.

```text
O(1)        constant growth
O(log n)    logarithmic growth
O(n)        linear growth
O(n log n)  linearithmic growth
O(n²)       quadratic growth
```

The useful question is:

> If the input becomes much larger, how quickly does the required work grow?

### An ADT describes behavior; an implementation decides how it happens

A **stack** describes LIFO behavior.

That stack could be implemented using:

- an array,
- a dynamic array,
- a linked structure,
- or another underlying representation.

The interface tells you **what operations mean**. The implementation determines **how those operations are performed and what they cost**.

### Hash tables are fast because of good engineering, not magic

Hash-based structures can provide average-case constant-time access, but that depends on things like:

- a useful hash function,
- a reasonable load factor,
- collision handling,
- and resizing strategy.

Collisions are unavoidable because a large set of possible keys is being mapped into a finite number of buckets.

### Tree shape matters

A binary search tree can be extremely efficient when its shape stays reasonably balanced.

```text
Balanced-ish BST

        8
      /   \
     4     12
    / \    / \
   2   6  10 14
```

But a badly skewed tree can begin to behave more like a linked list.

```text
2
 \
  4
   \
    6
     \
      8
```

Same basic structure. Very different performance.

### BFS and DFS differ mainly in exploration order

**Breadth-first search** explores outward layer by layer.

**Depth-first search** follows a path deeply before backtracking.

That difference in order is why BFS is naturally useful for shortest paths in unweighted graphs, while DFS is useful for many structural exploration problems.

### Recursion is easier when you stop thinking about the entire call chain

A recursive method generally needs:

1. a **base case** that stops,
2. a **smaller version of the problem**, and
3. confidence that the recursive call handles that smaller problem.

Trying to mentally execute every recursive call at once usually makes recursion feel harder than it is.

## Java & DSA Knowledge Map

The map below organizes Java fundamentals and the major data-structure-related ideas I repeatedly come back to in 2214.

Use it to:

- refresh Java fundamentals,
- identify concepts that still feel fuzzy,
- connect structures to the operations they support,
- review before quizzes or exams,
- or jump into a topic without reading everything line by line.

<script>
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.back-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
});
</script>


<div class="knowledge-map">
<pre>
Understanding Java
    ├─ <a id="map-program-lifecycle" href="#program-lifecycle" class="map-link"><span class="root">Program lifecycle</span></a>
    │  ├─ <a id="map-source-code" href="#source-code" class="map-link">Source code (.java)</a>
    │  │  └─ Human-readable Java source
    │  ├─ <a id="map-compilation" href="#compilation" class="map-link">Compilation (javac)</a>
    │  │  └─ Converts .java → .class (bytecode)
    │  ├─ <a id="map-bytecode" href="#bytecode" class="map-link">Bytecode (.class)</a>
    │  │  └─ Platform-independent instructions
    │  └─ <a id="map-jvm-execution" href="#jvm-execution" class="map-link">JVM execution</a>
    │     └─ Bytecode executed on target machine
    │
    ├─ <a id="map-basics" href="#basics" class="map-link"><span class="root">Basics</span></a>
    │  ├─ Program entry
    │  │  ├─ main(String[] args)
    │  │  │  └─ Entry point for all Java programs
    │  │  └─ Execution order
    │  │     └─ Top-to-bottom, statement by statement
    │  │
    │  ├─ Data types and variables
    │  │  ├─ Variables
    │  │  │  └─ Named storage locations with a fixed type
    │  │  │
    │  │  ├─ Primitive data types
    │  │  │  ├─ byte (8-bit)
    │  │  │  ├─ short (16-bit)
    │  │  │  ├─ int (32-bit)
    │  │  │  ├─ long (64-bit)
    │  │  │  ├─ float (32-bit, decimal)
    │  │  │  ├─ double (64-bit, decimal)
    │  │  │  ├─ char (Unicode character)
    │  │  │  └─ boolean (true / false)
    │  │  │     └─ Not numeric (0 ≠ false)
    │  │  │
    │  │  ├─ Reference types
    │  │  │  ├─ Store memory address
    │  │  │  ├─ Examples: String, arrays, objects
    │  │  │  └─ Created using new
    │  │  │
    │  │  ├─ Stack vs Heap
    │  │  │  ├─ Primitives → stack (values)
    │  │  │  └─ References → stack (address) → heap (object)
    │  │  │
    │  │  ├─ Type casting
    │  │  │  ├─ Implicit (widening)
    │  │  │  │  └─ int → long
    │  │  │  ├─ Explicit (narrowing)
    │  │  │  │  └─ long → int
    │  │  │  └─ boolean cannot be cast
    │  │  │
    │  │  └─ Variable scope
    │  │     ├─ Local
    │  │     ├─ Parameter
    │  │     └─ Field
    │  │
    │  ├─ Operations on primitive types
    │  │  ├─ Arithmetic (+ − * / %)
    │  │  ├─ Increment / decrement
    │  │  │  ├─ Postfix (a++, a--) → use then modify
    │  │  │  └─ Prefix (++a, --a) → modify then use
    │  │  │
    │  │  ├─ Relational operators
    │  │  │  ├─ ==, !=
    │  │  │  ├─ >, >=
    │  │  │  └─ <, <=
    │  │  │
    │  │  ├─ Boolean logic
    │  │  │  ├─ NOT (!) → invert
    │  │  │  ├─ AND (&&) → both true
    │  │  │  ├─ OR (||) → one true
    │  │  │  ├─ XOR (^) → different
    │  │  │  ├─ Precedence: ! → ^ → && → ||
    │  │  │  └─ Short-circuiting
    │  │  │     ├─ false && … → false
    │  │  │     └─ true || … → true
    │  │  │
    │  │  └─ Assignment operators
    │  │     └─ =, +=, -=, *=, /=, %=
    │  │
    │  ├─ Control flow statements
    │  │  ├─ Conditionals
    │  │  │  ├─ if / else
    │  │  │  ├─ switch
    │  │  │  └─ Ternary: cond ? a : b
    │  │  │
    │  │  ├─ Loops
    │  │  │  ├─ for
    │  │  │  ├─ while
    │  │  │  └─ do-while
    │  │  │
    │  │  └─ Branching
    │  │     ├─ break
    │  │     └─ continue
    │  │
    │  └─ Strings
    │     ├─ String (immutable)
    │     │  ├─ length()
    │     │  ├─ charAt(i)
    │     │  ├─ substring(i), substring(i, j)
    │     │  ├─ equals / equalsIgnoreCase
    │     │  ├─ compareTo / compareToIgnoreCase
    │     │  ├─ contains
    │     │  ├─ startsWith / endsWith
    │     │  ├─ indexOf / lastIndexOf
    │     │  ├─ toLowerCase / toUpperCase / trim
    │     │  ├─ split(regex)
    │     │  └─ toCharArray()
    │     │
    │     ├─ Character helpers
    │     │  ├─ isLetter / isDigit / isLetterOrDigit
    │     │  ├─ isUpperCase / isLowerCase
    │     │  └─ toUpperCase / toLowerCase
    │     │
    │     └─ StringBuilder (mutable)
    │        ├─ append(String / char / int)
    │        ├─ setCharAt
    │        ├─ insert
    │        ├─ delete
    │        └─ toString()
    │
    ├─ <a id="map-code-organization" href="#code-organization" class="map-link"><span class="root">Code organization</span></a>
    │  ├─ Methods
    │  │  ├─ Declaration
    │  │  │  └─ modifiers + return + name + params + body
    │  │  ├─ Signature
    │  │  │  └─ name + parameter list
    │  │  ├─ Static vs instance
    │  │  ├─ main method
    │  │  │  └─ public static void main(String[] args)
    │  │  ├─ Method calls
    │  │  │  ├─ Class.method()
    │  │  │  └─ object.method()
    │  │  └─ Built-in vs user-defined
    │  │
    │  ├─ Classes and objects
    │  │  ├─ Class → blueprint
    │  │  ├─ Object → instance
    │  │  ├─ Fields → state
    │  │  ├─ Constructors → initialization
    │  │  └─ this → current object
    │  │
    │  └─ Inheritance (IS-A)
    │     ├─ extends keyword
    │     ├─ Single inheritance
    │     └─ Polymorphism (override)
    │
    ├─ <a id="map-working-with-data" href="#working-with-data" class="map-link"><span class="root">Working with data</span></a>
    │  ├─ Arrays
    │  │  ├─ Declaration: int[] arr
    │  │  ├─ Instantiation: new int[n]
    │  │  ├─ Default values
    │  │  │  ├─ int → 0
    │  │  │  ├─ boolean → false
    │  │  │  └─ reference → null
    │  │  ├─ Length: arr.length (field)
    │  │  ├─ Iteration
    │  │  │  ├─ for (i < arr.length)
    │  │  │  └─ for-each
    │  │  ├─ Processing patterns
    │  │  │  ├─ Search
    │  │  │  ├─ Accumulate
    │  │  │  └─ Predicate check
    │  │  └─ 2D arrays
    │  │     └─ Nested loops
    │  │
    │  ├─ Collections framework
    │  │  ├─ Iterable
    │  │  ├─ List
    │  │  │  ├─ ArrayList (dynamic array)
    │  │  │  └─ LinkedList (node-based)
    │  │  ├─ Set
    │  │  │  └─ HashSet
    │  │  └─ Map
    │  │     └─ HashMap
    │  │
    │  ├─ Searching & ordering
    │  │  ├─ Linear search
    │  │  ├─ Comparable
    │  │  │  └─ object defines compareTo
    │  │  └─ Comparator
    │  │     └─ external comparison logic
    │  │
    │  ├─ Hashing
    │  │  ├─ char → Unicode int
    │  │  ├─ Accumulate values
    │  │  └─ Modulo tableSize
    │  │
    │  ├─ Stacks & queues
    │  │  ├─ Stack (LIFO)
    │  │  │  ├─ push / pop / peek
    │  │  │  └─ Reverse, palindrome, postfix
    │  │  └─ Queue (FIFO)
    │  │     ├─ enqueue / dequeue
    │  │     └─ Conditional cycling
    │  │
    │  ├─ Linked structures
    │  │  ├─ Node&lt;E&gt; (data, next)
    │  │  ├─ Build from array
    │  │  ├─ Insert / remove
    │  │  └─ Linear search
    │  │
    │  ├─ Recursion
    │  │  ├─ Base case
    │  │  ├─ Recursive case
    │  │  ├─ Math sequences
    │  │  ├─ String recursion
    │  │  ├─ Array recursion
    │  │  └─ Tree recursion
    │  │
    │  ├─ Trees
    │  │  ├─ Binary tree
    │  │  ├─ Traversals
    │  │  │  ├─ Preorder (NLR)
    │  │  │  ├─ Inorder (LNR)
    │  │  │  └─ Postorder (LRN)
    │  │  └─ Properties
    │  │     ├─ Height
    │  │     ├─ Node count
    │  │     └─ Full / complete
    │  │
    │  └─ Graphs
    │     ├─ Representations
    │     │  ├─ Adjacency matrix
    │     │  └─ Adjacency list
    │     ├─ Properties
    │     │  ├─ Self loops
    │     │  ├─ Degree
    │     │  ├─ Edge count
    │     │  ├─ Complete graph
    │     │  └─ Triangle detection
    │     └─ Graph algorithms
    │        ├─ hasEdge
    │        ├─ removeEdge
    │        ├─ getNodeDegree
    │        └─ Matrix ↔ list conversion
    │
    └─ <a id="map-errorless-code" href="#errorless-code" class="map-link"><span class="root">Errorless code</span></a>
            ├─ Exceptions
            │  ├─ Checked
            │  ├─ Unchecked
            │  └─ try / catch / finally
            │
            ├─ Common runtime errors
            │  ├─ NullPointerException
            │  ├─ ArithmeticException
            │  └─ IndexOutOfBoundsException
            │
            └─ Testing
                ├─ Unit tests
                ├─ Assertions
                └─ JUnit
</pre>
</div>

<div id="program-lifecycle" class="section-anchor"></div>
## <a href="#map-program-lifecycle" class="back-link">Program lifecycle</a>

<div id="source-code" class="section-anchor"></div>
#### <a href="#map-source-code" class="back-link">Source code</a>
Source code is the human-written form of a Java program and is where all logic is defined using Java’s syntax and rules. These files are readable and editable by programmers but cannot be executed directly by the computer.

In real projects (especially coursework), you may be given empty or partially completed `.java` files to implement while other functionality already exists as compiled `.class` files. This separation is intentional: it allows you to write code against an existing interface or API without seeing the full implementation, which mirrors how real-world libraries are used.

When you type in VS Code, the editor is constantly analyzing your source code in the background. It checks for syntax errors, missing imports, type mismatches, and unresolved methods before you ever run the program, which is why errors and warnings appear as you type.



<div id="compilation" class="section-anchor"></div>
#### <a href="#map-compilation" class="back-link">Compilation</a>
Compilation is the process where the Java compiler, `javac`, checks `.java` files for syntax and type errors. If the code is valid, `javac` translates the source code into `.class` files containing bytecode.

This step is where Java becomes strict: every variable must have a type, every method call must exist, and access rules must be respected. If compilation fails, no `.class` file is produced, and the program cannot proceed.

When you click Run or Test in VS Code, the IDE automatically invokes `javac` for you behind the scenes. The success or failure of compilation directly determines whether the JVM will ever start, which is why many errors never make it to “runtime.”



<div id="bytecode" class="section-anchor"></div>
#### <a href="#map-bytecode" class="back-link">Bytecode</a>
Bytecode is the compiled output of a Java program stored in `.class` files. It is platform-independent and designed to run on any system that has a Java Virtual Machine.

Although `.class` files may show readable strings when opened in an editor, they are not human-readable source code and are not meant to be edited. What you’re seeing are embedded names, constants, and metadata that help the JVM and tools like debuggers and test frameworks understand the structure of the program.

At this stage, your program exists as structured instructions, not text logic. This is the form that libraries, testing frameworks, and the JVM itself work with.


<div id="jvm-execution" class="section-anchor"></div>
#### <a href="#map-jvm-execution" class="back-link">JVM execution</a>
JVM execution begins when a Java program is run and the Java Virtual Machine starts with a specific entry point, such as a `main` method or a JUnit test. The JVM does not load every class at once; instead, it loads `.class` files on demand as they are needed.

Each class is first verified to ensure the bytecode is safe and valid, then linked so references between classes can be resolved. Only after this does execution begin, with the JVM translating bytecode into machine code that your operating system can run.

During execution, tools like VS Code, JUnit, and the Java runtime collect information about what code is being used. When you see percentages, green checkmarks, or coverage bars, those come from testing and coverage tools that track which lines and branches of bytecode were executed during a run.

In other words, VS Code isn’t just “running” your program. It is coordinating compilation, launching the JVM, running tests, observing execution, and reporting results back to you in a human-friendly way.


Java separates writing, checking, running, and observing code into clear stages, and your IDE simply automates the handoff between them.







<div id="basics" class="section-anchor"></div>
## <a href="#map-basics" class="back-link">Basics</a>


<div id="code-organization" class="section-anchor"></div>
## <a href="#map-code-organization" class="back-link">Code organization</a>


<div id="working-with-data" class="section-anchor"></div>
## <a href="#map-working-with-data" class="back-link">Working with data</a>


<div id="errorless-code" class="section-anchor"></div>
## <a href="#map-errorless-code" class="back-link">Errorless code</a>



<div id="program-entry" class="section-anchor"></div>
#### <a href="#map-basics" class="back-link">Program entry</a>
Every Java program begins execution at `public static void main(String[] args)`, which serves as the JVM entry point. Statements execute top-to-bottom unless redirected by control flow constructs.

<div id="data-types-and-variables" class="section-anchor"></div>
#### <a href="#map-basics" class="back-link">Data types and variables</a>
Java is statically typed, meaning every variable must declare a fixed type such as `int`, `double`, or `String` before use. Variables represent named storage locations whose behavior depends on whether they are primitive values or object references.

<div id="operations-on-primitive-types" class="section-anchor"></div>
#### <a href="#map-basics" class="back-link">Operations on primitive types</a>
Primitive types support arithmetic, relational, and logical operations including `+`, `==`, `&&`, and `||` with defined precedence rules. Increment and decrement operators behave differently in prefix versus postfix form.

<div id="control-flow-statements" class="section-anchor"></div>
#### <a href="#map-basics" class="back-link">Control flow statements</a>
Control flow constructs such as `if`, `switch`, `for`, and `while` determine execution paths and repetition. Keywords like `break` and `continue` alter loop behavior at runtime.

<div id="strings" class="section-anchor"></div>
#### <a href="#map-basics" class="back-link">Strings</a>
`String` objects are immutable, meaning operations like `substring()` create new objects rather than modifying existing ones. `StringBuilder` enables efficient mutable string manipulation.

---

<div id="code-organization" class="section-anchor"></div>
## <a href="#map-code-organization" class="back-link">Code organization</a>

<div id="methods" class="section-anchor"></div>
#### <a href="#map-code-organization" class="back-link">Methods</a>
Methods encapsulate reusable behavior and are identified by a signature consisting of a name and parameter list. Calls resolve at compile time based on static types.

<div id="classes-and-objects" class="section-anchor"></div>
#### <a href="#map-code-organization" class="back-link">Classes and objects</a>
A `class` defines structure and behavior, while an `object` is a runtime instance created using `new`. Fields store state, and constructors initialize that state.

<div id="inheritance" class="section-anchor"></div>
#### <a href="#map-code-organization" class="back-link">Inheritance</a>
Inheritance establishes an IS-A relationship using `extends`, allowing subclasses to reuse and override behavior. Java supports single inheritance with runtime polymorphism.

---

<div id="working-with-data" class="section-anchor"></div>
## <a href="#map-working-with-data" class="back-link">Working with data</a>

<div id="arrays" class="section-anchor"></div>
#### <a href="#map-working-with-data" class="back-link">Arrays</a>
Arrays store fixed-size sequences of same-type elements and expose their size via `arr.length`. Elements are automatically initialized to default values.

<div id="collections-framework" class="section-anchor"></div>
#### <a href="#map-working-with-data" class="back-link">Collections framework</a>
The Collections Framework provides dynamic data structures such as `ArrayList`, `HashSet`, and `HashMap`. Interfaces define behavior while implementations determine performance.

<div id="searching-and-ordering" class="section-anchor"></div>
#### <a href="#map-working-with-data" class="back-link">Searching & ordering</a>
Linear search inspects elements sequentially, while ordering relies on `Comparable` or `Comparator`. Comparison logic determines sort order and equality semantics.

<div id="hashing" class="section-anchor"></div>
#### <a href="#map-working-with-data" class="back-link">Hashing</a>
Hashing converts data into integer indices using `hashCode()` and modulo arithmetic. Efficient hashing minimizes collisions and enables constant-time access.

<div id="stacks-and-queues" class="section-anchor"></div>
#### <a href="#map-working-with-data" class="back-link">Stacks & queues</a>
Stacks follow LIFO behavior using `push` and `pop`, while queues follow FIFO ordering using `enqueue` and `dequeue`. These structures model controlled access patterns.

<div id="linked-structures" class="section-anchor"></div>
#### <a href="#map-working-with-data" class="back-link">Linked structures</a>
Linked structures store elements in `Node<E>` objects connected by references rather than contiguous memory. This enables efficient insertion and removal.

<div id="recursion" class="section-anchor"></div>
#### <a href="#map-working-with-data" class="back-link">Recursion</a>
Recursion solves problems by invoking a method within itself until a base case is reached. Each recursive call consumes stack space.

<div id="trees" class="section-anchor"></div>
#### <a href="#map-working-with-data" class="back-link">Trees</a>
Trees represent hierarchical data using parent-child relationships. Traversals such as inorder and preorder define visit order.

<div id="graphs" class="section-anchor"></div>
#### <a href="#map-working-with-data" class="back-link">Graphs</a>
Graphs model arbitrary relationships using adjacency matrices or adjacency lists. Algorithms operate on edges, degrees, and connectivity.

---

<div id="errorless-code" class="section-anchor"></div>
## <a href="#map-errorless-code" class="back-link">Errorless code</a>

<div id="exceptions" class="section-anchor"></div>
#### <a href="#map-errorless-code" class="back-link">Exceptions</a>
Exceptions represent abnormal execution conditions handled using `try`, `catch`, and `finally`. Checked exceptions require explicit handling at compile time.

<div id="common-runtime-errors" class="section-anchor"></div>
#### <a href="#map-errorless-code" class="back-link">Common runtime errors</a>
Errors such as `NullPointerException` and `IndexOutOfBoundsException` occur during execution due to invalid state or access.

<div id="testing" class="section-anchor"></div>
#### <a href="#map-errorless-code" class="back-link">Testing</a>
Testing verifies correctness using unit tests, assertions, and frameworks like `JUnit`. Automated tests detect regressions early.


---

<div id="itsc-1212-1213" class="section-anchor"></div>

# ITSC 1212 / 1213 — Introduction to Computer Science I & II

**TA'd for Dr. Nadia Najjar** 

**Focus:** Programming fundamentals, Java, problem solving, methods, objects, arrays, collections, and recursion

1212 and 1213 are where a lot of the foundations for everything else in computer science are built.

These courses are not just about learning Java syntax. They are about learning how to take a problem, break it into steps, represent information in a program, control execution, organize behavior into methods and objects, and debug when your mental model does not match what the program is actually doing.

I have come to appreciate these classes even more after taking upper-level systems, algorithms, networking, and machine learning courses because the same fundamentals keep showing up.

## Technical bites

### A variable has a type, a value, and a scope

Those are three different ideas.

```java
int score = 95;
```

- `int` tells Java what kind of value can be stored.
- `score` is the variable name.
- `95` is the current value.
- where `score` is declared determines where it can be accessed.

A surprising amount of debugging becomes easier when you ask:

> What value does this variable hold **right now**, and is this even the same variable I think it is?

### Primitive values and object references behave differently

With primitives:

```java
int a = 5;
int b = a;
b = 10;
```

Changing `b` does not change `a`.

With objects, two variables can refer to the same object:

```java
Person a = new Person();
Person b = a;
```

Now `a` and `b` refer to the same underlying object.

That single idea explains a huge amount of Java behavior later on.

### `==` and `.equals()` answer different questions

For primitive values, `==` compares values.

For references, `==` asks whether two references identify the same object.

`.equals()` can be defined by a class to compare logical/content equality.

That is why:

```java
String a = new String("hello");
String b = new String("hello");
```

can represent two different objects containing equivalent text.

### Control flow is the path your program takes

Code does not simply exist as a block of statements. It moves through branches and repetitions.

```text
sequence
   ↓
decision
  / \
yes  no
 |    |
 └─→ continue
```

Understanding `if`, `else`, `switch`, `for`, `while`, `break`, and `continue` is really about understanding how execution moves.

### Methods separate a problem into smaller behaviors

A useful method should do one understandable job.

Instead of writing one enormous `main`, you can decompose a problem:

```text
read input
    ↓
validate input
    ↓
process data
    ↓
format result
    ↓
display result
```

Each step can become a method with clear inputs and outputs.

### Parameters receive values from the caller

Java is pass-by-value.

When an argument is supplied to a method, the method receives a copy of that value.

For an object variable, the copied value is a reference.

That is why a method can use a copied reference to mutate the same object even though Java is still pass-by-value.

### Arrays make indexing explicit

An array gives fixed-size indexed storage.

```java
int[] nums = new int[5];
```

Valid indices are:

```text
0 1 2 3 4
```

not:

```text
1 2 3 4 5
```

That small difference is behind a lot of `IndexOutOfBoundsException` errors.

### Strings are objects and they are immutable

Calling a method such as:

```java
name.toUpperCase();
```

does not mutate the existing `String`.

You need to use the returned value:

```java
name = name.toUpperCase();
```

When repeated mutation is needed, `StringBuilder` is often a better fit.

### Objects combine state and behavior

A class can be thought of as a definition:

```text
Person
├── state
│   ├── name
│   └── age
│
└── behavior
    ├── speak()
    └── birthday()
```

An object is one concrete runtime instance of that class.

This is the point where programs begin to feel less like sequences of statements and more like systems made of interacting components.

### Recursion is repeated problem reduction

A recursive method calls itself on a smaller version of the same problem.

For example:

```text
factorial(4)
    ↓
4 * factorial(3)
        ↓
    3 * factorial(2)
            ↓
        2 * factorial(1)
                ↓
                1
```

The two questions I always ask are:

> What stops the recursion?

and

> Does every call move closer to that stopping condition?

## Notes I want to keep building here

- Java program structure
- Primitive vs. reference types
- Variable scope
- Type casting
- Arithmetic and boolean expressions
- `if` / `else`
- Loops and loop tracing
- Methods and parameters
- Return values
- Pass-by-value
- Strings and `StringBuilder`
- Arrays
- 2D arrays
- `ArrayList`
- Classes and objects
- Constructors
- `this`
- Encapsulation
- Inheritance
- Polymorphism
- Exceptions
- Unit testing
- Recursion
- Debugging strategies
- `==` vs. `.equals()`
- Common `NullPointerException` causes
- Reading stack traces

## Things I think matter beyond the class

### Trace code before guessing

When a program is confusing, write down the values.

```text
i = 0
sum = 0

iteration 1 → ...
iteration 2 → ...
iteration 3 → ...
```

Tracing execution is slower than guessing for about thirty seconds and much faster than guessing for thirty minutes.

### Read the error message from the inside out

A compiler error or stack trace is not just a failure message. It is information about:

- what went wrong,
- where Java noticed it,
- and often which assumption in your code was false.

Learning to read errors is part of learning to program.

### Syntax is temporary; mental models last

You can always look up the exact syntax for a loop, collection method, or API call.

The important part is understanding:

- what data exists,
- what state changes,
- what code executes next,
- what a method receives,
- and what an object represents.

Those ideas carry into basically every language and every later CS course.

---

# Why I keep these notes

The most useful notes are not the ones that copy a lecture slide word-for-word.

They are the ones that preserve the mental model that made something click.

That is what I want this page to become over time: a technical notebook I can keep expanding as I TA, take new classes, work on projects, and revisit concepts I thought I already understood.

Some entries will eventually become full study guides. Some will be tiny reminders. Some will be diagrams, code examples, or explanations of mistakes I have seen repeatedly.

The common goal is simple:

> understand the idea well enough that it still makes sense after the exam is over.

[Back to top](#notes)

