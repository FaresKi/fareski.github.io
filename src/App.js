import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import "@xterm/xterm/css/xterm.css";
import "./App.css";
import { experiences } from "./experiences";
import { projects } from "./projects";
import { schools } from "./schools";

const WELCOME_MESSAGE =
  "Hi! You found my portfolio, please type 'help' to find out which commands you can type 💻\r\n";

const COMMANDS = [
  "help",
  "profile",
  "exp",
  "exp <name>",
  "school",
  "clear",
  "proj",
  "proj <name>",
];

const PROMPT = "➜";

const XTermApp = () => {
  const terminalRef = useRef(null);
  const xterm = useRef(null);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(null);

  // Command handler map
  const commandHandlers = useMemo(
    () => ({
      help: () =>
        "There are several commands:\r\n- profile: to talk about myself and who I am 👤\r\n- exp: where I present my professional experiences 💼\r\n- school: where I present my academic path 🏫.\r\n- clear: to clear the terminal 🧹\r\n- proj: to see my projects 💻\r\n",
      profile: () =>
        `Hi 👋🏽, my name is Fares, and I'm a backend software engineer!\r\nI love challenges, and live for the thrill of solving problems!\r\nSo far, I've had the opportunity to work in 2 different organizations.\r\nPlease type 'exp' to see my professional experience 💼\r\n`,
      exp: () =>
        experiences
          .map(
            (exp) =>
              `${exp.value.split("\n")[0]}\r\n${exp.value.split("\n")[1]}`
          )
          .join("\r\n"),
      school: () => schools.map((school) => school.value).join("\r\n"),
      clear: () => "__CLEAR__",
      proj: () =>
        (projects.projects || projects).map((proj) => proj.title).join("\r\n"),
    }),
    []
  );

  // Command handler logic
  const handleCommand = useCallback(
    (cmd) => {
      const [base, ...args] = cmd.trim().split(" ");
      if (base === "exp" && args.length === 1) {
        const found = experiences.find((e) => e.name === args[0]);
        return found
          ? found.value.replace(/\n/g, "\r\n")
          : "Sorry, I don't know about this experience 😢. Please type exp to find out which ones I have worked for 💼";
      }
      if (base === "proj" && args.length === 1) {
        const found = (projects.projects || projects).find(
          (p) => p.name === args[0]
        );
        if (found) {
          return `${found.title}\r\n• ${found.description}\r\n• Stack: ${found.stack}\r\n• GitHub: ${found.github}`;
        }
        return "Sorry, I don't know about this project 😢. Please type proj to find out which ones I have worked on 💻";
      }
      if (commandHandlers[base]) {
        return commandHandlers[base]();
      }
      return "Sorry, I don't know what you're trying to say.\r\nPlease type 'help' to see what I can do for you 💻\r\n";
    },
    [commandHandlers]
  );

  // Initialize terminal and event listeners on mount
  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      allowProposedApi: true,
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      fontSize: 14,
      theme: {
        background: "#1e1e1e",
        foreground: "#dcdfe4",
        cursor: "#c678dd",
        selection: "#3e4451",
        black: "#1e1e1e",
        red: "#e06c75",
        green: "#98c379",
        yellow: "#e5c07b",
        blue: "#61afef",
        magenta: "#c678dd",
        cyan: "#56b6c2",
        white: "#dcdfe4",
        brightBlack: "#5c6370",
        brightRed: "#e06c75",
        brightGreen: "#98c379",
        brightYellow: "#e5c07b",
        brightBlue: "#61afef",
        brightMagenta: "#c678dd",
        brightCyan: "#56b6c2",
        brightWhite: "#ffffff",
      },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new Unicode11Addon());
    term.unicode.activeVersion = "11";

    xterm.current = term;

    if (terminalRef.current) {
      term.open(terminalRef.current);
      fitAddon.fit();
      term.options.wordWrap = term.cols;
      term.writeln(WELCOME_MESSAGE);
      term.write(`${PROMPT} `);
    }

    const handleResize = () => {
      fitAddon.fit();
      term.options.wordWrap = term.cols;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
    };
  }, []);

  // Click handler to refocus terminal
  const handleTerminalClick = () => {
    if (xterm.current) {
      xterm.current.focus();
    }
  };

  // Handle terminal key input
  const onData = useCallback(
    (data) => {
      if (!xterm.current) return;
      const term = xterm.current;

      const code = data.charCodeAt(0);
      switch (data) {
        case "\r": {
          // Enter
          term.write("\r\n");
          if (input.trim() === "") {
            term.write(`${PROMPT} `);
            setInput("");
            break;
          }
          if (input.trim()) {
            setHistory((prev) => [...prev, input]);
            setHistoryIndex(null);
          }
          const output = handleCommand(input);
          if (output === "__CLEAR__") {
            term.clear();
          } else if (output) {
            term.writeln(output);
          }
          term.write(`${PROMPT} `);
          setInput("");
          break;
        }
        case "\u007F": {
          // Backspace
          if (input.length > 0) {
            term.write("\b \b");
            setInput(input.slice(0, -1));
          }
          break;
        }
        case "\u001b[A": {
          // Up arrow
          if (history.length > 0) {
            const newIndex =
              historyIndex === null
                ? history.length - 1
                : Math.max(0, historyIndex - 1);
            setHistoryIndex(newIndex);
            const cmd = history[newIndex];
            for (let i = 0; i < input.length; i++) term.write("\b \b");
            term.write(cmd);
            setInput(cmd);
          }
          break;
        }
        case "\u001b[B": {
          // Down arrow
          if (history.length > 0 && historyIndex !== null) {
            const newIndex = historyIndex + 1;
            if (newIndex < history.length) {
              const cmd = history[newIndex];
              for (let i = 0; i < input.length; i++) term.write("\b \b");
              term.write(cmd);
              setInput(cmd);
              setHistoryIndex(newIndex);
            } else {
              for (let i = 0; i < input.length; i++) term.write("\b \b");
              setInput("");
              setHistoryIndex(null);
            }
          }
          break;
        }
        case "\t": {
          let matches = [];
          if (input.startsWith("exp ")) {
            const partial = input.slice(4);
            const names = experiences.map((e) => e.name);
            matches = names.filter((name) => name.startsWith(partial));
            if (matches.length === 1) {
              const completion = matches[0].slice(partial.length);
              term.write(completion);
              setInput(`exp ${matches[0]}`);
            } else if (matches.length > 1) {
              term.write("\r\n");
              term.writeln(matches.join("    "));
              term.write(`${PROMPT} ${input}`);
            }
          } else if (input.startsWith("proj ")) {
            const partial = input.slice(5);
            const names = (projects.projects || projects).map((p) => p.name);
            matches = names.filter((name) => name.startsWith(partial));
            if (matches.length === 1) {
              const completion = matches[0].slice(partial.length);
              term.write(completion);
              setInput(`proj ${matches[0]}`);
            } else if (matches.length > 1) {
              term.write("\r\n");
              term.writeln(matches.join("    "));
              term.write(`${PROMPT} ${input}`);
            }
          } else {
            matches = COMMANDS.filter((cmd) => cmd.startsWith(input));
            if (matches.length === 1) {
              const completion = matches[0].slice(input.length);
              term.write(completion);
              setInput(matches[0]);
            } else if (matches.length > 1) {
              term.write("\r\n");
              term.writeln(matches.join("    "));
              term.write(`${PROMPT} ${input}`);
            }
          }
          break;
        }
        default: {
          if (code >= 32 && code <= 126) {
            term.write(data);
            setInput(input + data);
          }
          break;
        }
      }
    },
    [handleCommand, history, historyIndex, input]
  );

  useEffect(() => {
    if (!xterm.current) return;

    const term = xterm.current;

    const disposable = term.onData(onData);

    return () => {
      disposable.dispose();
    };
  }, [onData]);

  return (
    <section
      aria-label="Terminal"
      onClick={handleTerminalClick}
      onKeyDown={() => {}}
      style={{ width: "100%", height: "100vh" }}
    >
      <div ref={terminalRef} style={{ width: "100%", height: "100%" }} />
    </section>
  );
};

export default XTermApp;
