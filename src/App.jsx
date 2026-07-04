import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Moon,
  Sun,
  Trophy,
  Zap,
  Info,
  Plus,
  X,
} from "lucide-react";

const App = () => {
  const [arrays, setArrays] = useState({});
  const [inputArray, setInputArray] = useState("64, 34, 25, 12, 22, 11, 90");
  const [arraySize, setArraySize] = useState(50);
  const [speed, setSpeed] = useState(50);
  const [selectedAlgos, setSelectedAlgos] = useState(["bubble"]);
  const [racing, setRacing] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [raceResults, setRaceResults] = useState([]);
  const [showDetails, setShowDetails] = useState(null);
  const [customArrayMode, setCustomArrayMode] = useState(false);

  const stopRef = useRef(false);
  const startTimesRef = useRef({}); // track per-algo start times

  const algorithms = {
    bubble: {
      name: "Bubble Sort",
      time: "O(n²)",
      space: "O(1)",
      desc: "Repeatedly steps through the list, compares adjacent elements and swaps them if in wrong order.",
      emoji: "🫧",
      color: "from-blue-500 to-cyan-500",
    },
    selection: {
      name: "Selection Sort",
      time: "O(n²)",
      space: "O(1)",
      desc: "Finds the minimum element and places it at the beginning, then repeats for remaining elements.",
      emoji: "🎯",
      color: "from-purple-500 to-pink-500",
    },
    insertion: {
      name: "Insertion Sort",
      time: "O(n²)",
      space: "O(1)",
      desc: "Builds sorted array one item at a time by inserting elements into their correct position.",
      emoji: "📌",
      color: "from-green-500 to-emerald-500",
    },
    merge: {
      name: "Merge Sort",
      time: "O(n log n)",
      space: "O(n)",
      desc: "Divides array into halves, sorts them recursively, and merges the sorted halves.",
      emoji: "🔀",
      color: "from-orange-500 to-red-500",
    },
    quick: {
      name: "Quick Sort",
      time: "O(n log n)",
      space: "O(log n)",
      desc: "Picks a pivot element and partitions array around it, then recursively sorts partitions.",
      emoji: "⚡",
      color: "from-yellow-500 to-amber-500",
    },
  };

  // compute progress as percentage of elements that match positions of a fully-sorted array
  const computeProgressFromArray = (arr) => {
    if (!arr || arr.length === 0) return 0;
    const sorted = [...arr].slice().sort((a, b) => a - b);
    // handle duplicates: count indices where value equals sorted value.
    let correct = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === sorted[i]) correct++;
    }
    return Math.round((correct / arr.length) * 100);
  };

  useEffect(() => {
    if (!customArrayMode) {
      generateRandomArray();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arraySize, customArrayMode]);

  const generateRandomArray = () => {
    const newArray = Array.from(
      { length: arraySize },
      () => Math.floor(Math.random() * 400) + 20
    );
    initializeArrays(newArray);
  };

  const parseCustomArray = () => {
    try {
      const parsed = inputArray
        .split(",")
        .map((val) => {
          const num = parseInt(val.trim());
          return isNaN(num) ? 0 : Math.max(20, Math.min(420, num));
        })
        .filter((val) => val > 0);

      if (parsed.length === 0) {
        alert("Please enter valid numbers separated by commas");
        return;
      }

      initializeArrays(parsed);
    } catch (e) {
      alert(
        "Invalid input format. Use numbers separated by commas (e.g., 5, 3, 8, 1)"
      );
    }
  };

  const initializeArrays = (baseArray) => {
    // stop any running race
    stopRef.current = true;
    setRacing(false);
    setRaceResults([]);
    startTimesRef.current = {};

    const newArrays = {};
    selectedAlgos.forEach((algo) => {
      newArrays[algo] = {
        array: [...baseArray],
        comparing: [],
        sorted: [],
        swapping: [],
        finished: false,
        steps: 0,
        position: 0,
        progress: computeProgressFromArray(baseArray),
      };
    });
    setArrays(newArrays);
  };

  const toggleAlgorithm = (algo) => {
    if (racing) return;

    setSelectedAlgos((prev) => {
      const newSelected = prev.includes(algo)
        ? prev.filter((a) => a !== algo)
        : [...prev, algo];
      if (newSelected.length === 0) return prev;
      // If algo was added, initialize its array to current base array (use first existing algo array or random)
      // We'll regenerate arrays to include new selection using existing array if present
      if (Object.keys(arrays).length > 0) {
        const base = arrays[prev[0]]
          ? arrays[prev[0]].array
          : Array.from(
              { length: arraySize },
              () => Math.floor(Math.random() * 400) + 20
            );
        const merged = { ...arrays };
        newSelected.forEach((a) => {
          if (!merged[a]) {
            merged[a] = {
              array: [...base],
              comparing: [],
              sorted: [],
              swapping: [],
              finished: false,
              steps: 0,
              position: 0,
              progress: computeProgressFromArray(base),
            };
          }
        });
        setArrays(merged);
      }
      return newSelected;
    });
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const updateAlgoState = (algo, updates) => {
    setArrays((prev) => ({
      ...prev,
      [algo]: { ...prev[algo], ...updates },
    }));
  };

  // helper to mark finish and register result
  const markAlgorithmFinished = (algo, steps) => {
    updateAlgoState(algo, { finished: true, comparing: [], swapping: [] });

    const start = startTimesRef.current[algo];
    const timeTaken = start ? Date.now() - start : 0;

    // Push into raceResults and keep it sorted by timeTaken
    setRaceResults((prev) => {
      const existing = prev.filter((r) => r.algo !== algo);
      const next = [...existing, { algo, timeTaken, steps }].sort(
        (a, b) => a.timeTaken - b.timeTaken
      );
      return next;
    });
  };

  // ---------------------
  // Sorting Algorithms
  // ---------------------

  const bubbleSort = async (algo, arr) => {
    const n = arr.length;
    let steps = 0;

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (stopRef.current) return;
        steps++;
        updateAlgoState(algo, {
          comparing: [j, j + 1],
          steps,
          progress: computeProgressFromArray(arr),
        });
        await sleep(101 - speed);

        if (arr[j] > arr[j + 1]) {
          updateAlgoState(algo, { swapping: [j, j + 1] });
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          updateAlgoState(algo, {
            array: [...arr],
            progress: computeProgressFromArray(arr),
          });
          await sleep(101 - speed);
          updateAlgoState(algo, { swapping: [] });
        }
      }
      // mark last i+1 elements as sorted from end
      const sortedIndices = Array.from(
        { length: i + 1 },
        (_, idx) => n - 1 - idx
      );
      updateAlgoState(algo, {
        sorted: sortedIndices,
        progress: computeProgressFromArray(arr),
      });
    }

    updateAlgoState(algo, {
      sorted: Array.from({ length: n }, (_, i) => i),
      comparing: [],
      finished: true,
      progress: 100,
    });

    markAlgorithmFinished(algo, steps);
  };

  const selectionSort = async (algo, arr) => {
    const n = arr.length;
    let steps = 0;

    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        if (stopRef.current) return;
        steps++;
        updateAlgoState(algo, {
          comparing: [minIdx, j],
          steps,
          progress: computeProgressFromArray(arr),
        });
        await sleep(101 - speed);

        if (arr[j] < arr[minIdx]) minIdx = j;
      }

      if (minIdx !== i) {
        updateAlgoState(algo, { swapping: [i, minIdx] });
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        updateAlgoState(algo, {
          array: [...arr],
          progress: computeProgressFromArray(arr),
        });
        await sleep(101 - speed);
        updateAlgoState(algo, { swapping: [] });
      }

      updateAlgoState(algo, {
        sorted: Array.from({ length: i + 1 }, (_, idx) => idx),
        progress: computeProgressFromArray(arr),
      });
    }

    updateAlgoState(algo, {
      sorted: Array.from({ length: n }, (_, i) => i),
      comparing: [],
      finished: true,
      progress: 100,
    });

    markAlgorithmFinished(algo, steps);
  };

  const insertionSort = async (algo, arr) => {
    const n = arr.length;
    let steps = 0;

    for (let i = 1; i < n; i++) {
      let key = arr[i];
      let j = i - 1;

      while (j >= 0 && arr[j] > key) {
        if (stopRef.current) return;
        steps++;
        updateAlgoState(algo, {
          comparing: [j, j + 1],
          steps,
          progress: computeProgressFromArray(arr),
        });
        await sleep(101 - speed);

        arr[j + 1] = arr[j];
        updateAlgoState(algo, {
          array: [...arr],
          progress: computeProgressFromArray(arr),
        });
        j--;
      }

      arr[j + 1] = key;
      updateAlgoState(algo, {
        array: [...arr],
        sorted: Array.from({ length: i + 1 }, (_, idx) => idx),
        progress: computeProgressFromArray(arr),
      });
    }

    updateAlgoState(algo, {
      sorted: Array.from({ length: n }, (_, i) => i),
      comparing: [],
      finished: true,
      progress: 100,
    });

    markAlgorithmFinished(algo, /* steps */ arrays[algo]?.steps ?? 0);
  };

  const mergeSort = async (algo, arr, start = 0, end = null) => {
    if (end === null) end = arr.length - 1;
    if (start >= end) return;

    const mid = Math.floor((start + end) / 2);
    await mergeSort(algo, arr, start, mid);
    await mergeSort(algo, arr, mid + 1, end);
    await merge(algo, arr, start, mid, end);
  };

  const merge = async (algo, arr, start, mid, end) => {
    const left = arr.slice(start, mid + 1);
    const right = arr.slice(mid + 1, end + 1);
    let i = 0,
      j = 0,
      k = start;

    while (i < left.length && j < right.length) {
      if (stopRef.current) return;
      updateAlgoState(algo, {
        comparing: [start + i, mid + 1 + j],
        steps: (arrays[algo]?.steps || 0) + 1,
      });
      await sleep(101 - speed);

      if (left[i] <= right[j]) {
        arr[k++] = left[i++];
      } else {
        arr[k++] = right[j++];
      }
      updateAlgoState(algo, {
        array: [...arr],
        progress: computeProgressFromArray(arr),
      });
    }

    while (i < left.length) arr[k++] = left[i++];
    while (j < right.length) arr[k++] = right[j++];

    updateAlgoState(algo, {
      array: [...arr],
      progress: computeProgressFromArray(arr),
    });

    // if top-level merge finished (full array), mark done
    if (start === 0 && end === arr.length - 1) {
      updateAlgoState(algo, {
        sorted: Array.from({ length: arr.length }, (_, i) => i),
        comparing: [],
        finished: true,
        progress: 100,
      });
      markAlgorithmFinished(algo, arrays[algo]?.steps ?? 0);
    }
  };

  const quickSort = async (algo, arr, low = 0, high = null) => {
    if (high === null) high = arr.length - 1;

    if (low < high) {
      const pi = await partition(algo, arr, low, high);
      await quickSort(algo, arr, low, pi - 1);
      await quickSort(algo, arr, pi + 1, high);
    }

    if (low === 0 && high === arr.length - 1) {
      updateAlgoState(algo, {
        sorted: Array.from({ length: arr.length }, (_, i) => i),
        comparing: [],
        finished: true,
        progress: 100,
      });
      markAlgorithmFinished(algo, arrays[algo]?.steps ?? 0);
    }
  };

  const partition = async (algo, arr, low, high) => {
    const pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      if (stopRef.current) return i + 1;

      updateAlgoState(algo, {
        comparing: [j, high],
        steps: (arrays[algo]?.steps || 0) + 1,
        progress: computeProgressFromArray(arr),
      });
      await sleep(101 - speed);

      if (arr[j] < pivot) {
        i++;
        updateAlgoState(algo, { swapping: [i, j] });
        [arr[i], arr[j]] = [arr[j], arr[i]];
        updateAlgoState(algo, {
          array: [...arr],
          progress: computeProgressFromArray(arr),
        });
        await sleep(101 - speed);
        updateAlgoState(algo, { swapping: [] });
      }
    }

    updateAlgoState(algo, { swapping: [i + 1, high] });
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    updateAlgoState(algo, {
      array: [...arr],
      progress: computeProgressFromArray(arr),
    });
    await sleep(101 - speed);
    updateAlgoState(algo, { swapping: [] });

    return i + 1;
  };

  // ---------------------
  // Race Controller
  // ---------------------

  const startRace = async () => {
    if (racing) {
      // stop running race
      stopRef.current = true;
      setRacing(false);
      return;
    }

    // clear previous results
    setRaceResults([]);
    stopRef.current = false;
    setRacing(true);

    // set start times and ensure arrays exist for each selected algo
    selectedAlgos.forEach((algo) => {
      startTimesRef.current[algo] = Date.now();
      if (!arrays[algo]) {
        // fallback: initialize using a random base
        const base = Array.from(
          { length: arraySize },
          () => Math.floor(Math.random() * 400) + 20
        );
        updateAlgoState(algo, {
          array: base,
          comparing: [],
          sorted: [],
          swapping: [],
          finished: false,
          steps: 0,
          position: 0,
          progress: computeProgressFromArray(base),
        });
      }
    });

    // run all algorithms in parallel (their implementations update state themselves)
    const runners = selectedAlgos.map(async (algo) => {
      const arr = arrays[algo]
        ? [...arrays[algo].array]
        : Array.from(
            { length: arraySize },
            () => Math.floor(Math.random() * 400) + 20
          );

      switch (algo) {
        case "bubble":
          await bubbleSort(algo, arr);
          break;
        case "selection":
          await selectionSort(algo, arr);
          break;
        case "insertion":
          await insertionSort(algo, arr);
          break;
        case "merge":
          await mergeSort(algo, arr);
          break;
        case "quick":
          await quickSort(algo, arr);
          break;
        default:
          break;
      }
    });

    // Wait for all to finish (or stop)
    await Promise.all(runners);

    // if not stopped, ensure racing flag false (individual finishes already populated raceResults)
    if (!stopRef.current) {
      setRacing(false);
    } else {
      // if stopped manually, make sure we still set racing false
      setRacing(false);
    }
  };

  // compute a safe max value for bar heights
  const allValues = Object.values(arrays).flatMap((s) =>
    s && s.array ? s.array : []
  );
  const maxValue = allValues.length ? Math.max(...allValues) : 1;

  // determine leader based on highest progress (if racing)
  const leader = (() => {
    let best = null;
    for (const k of selectedAlgos) {
      if (!arrays[k]) continue;
      if (!best || (arrays[k].progress ?? 0) > (arrays[best].progress ?? 0))
        best = k;
    }
    return best;
  })();

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? "bg-linear-to-br from-slate-900 via-purple-900 to-slate-900"
          : "bg-linear-to-br from-gray-50 via-blue-50 to-gray-50"
      }`}
    >
      {/* Header */}
      <header
        className={`${
          darkMode ? "bg-slate-900/50" : "bg-white/50"
        } backdrop-blur-xl border-b ${
          darkMode ? "border-slate-700/50" : "border-gray-200/50"
        } sticky top-0 z-10`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-linear-to-br from-indigo-500 to-cyan-500 p-2 rounded-xl">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-linear-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                Sorting Algorithm Visualizer
              </h1>
              <p
                className={`text-xs ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                where logic meets visualization
              </p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${
              darkMode
                ? "bg-slate-800 hover:bg-slate-700"
                : "bg-gray-200 hover:bg-gray-300"
            } transition-all`}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Control Panel */}
        <div
          className={`${
            darkMode ? "bg-slate-800/50" : "bg-white/50"
          } backdrop-blur-xl rounded-2xl p-6 mb-8 border ${
            darkMode ? "border-slate-700/50" : "border-gray-200/50"
          } shadow-xl`}
        >
          {/* Algorithm Selection */}
          <div className="mb-6">
            <label
              className={`block text-sm font-medium mb-3 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Select Algorithms to Race (Choose 1 or more)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(algorithms).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => toggleAlgorithm(key)}
                  disabled={racing}
                  className={`group relative px-4 py-3 rounded-xl font-medium transition-all ${
                    selectedAlgos.includes(key)
                      ? `bg-linear-to-r ${val.color} text-white shadow-lg scale-105`
                      : darkMode
                      ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  } disabled:opacity-50`}
                >
                  <span className="text-2xl mb-1 block">{val.emoji}</span>
                  <span className="text-xs">{val.name.split(" ")[0]}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetails(key);
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Details"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>
          </div>

          {/* Array Input Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Input Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setCustomArrayMode(false)}
                  disabled={racing}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    !customArrayMode
                      ? "bg--to-r from-indigo-500 to-cyan-500 text-white"
                      : darkMode
                      ? "bg-slate-700 text-gray-300"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Random Array
                </button>
                <button
                  onClick={() => setCustomArrayMode(true)}
                  disabled={racing}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    customArrayMode
                      ? "bg--to-r from-indigo-500 to-cyan-500 text-white"
                      : darkMode
                      ? "bg-slate-700 text-gray-300"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Custom Input
                </button>
              </div>
            </div>

            {customArrayMode ? (
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Enter Numbers (comma-separated)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputArray}
                    onChange={(e) => setInputArray(e.target.value)}
                    disabled={racing}
                    placeholder="e.g., 64, 34, 25, 12, 22"
                    className={`flex-1 px-4 py-2 rounded-lg ${
                      darkMode
                        ? "bg-slate-700 text-white"
                        : "bg-gray-100 text-gray-900"
                    } border ${
                      darkMode ? "border-slate-600" : "border-gray-300"
                    } disabled:opacity-50`}
                  />
                  <button
                    onClick={parseCustomArray}
                    disabled={racing}
                    className="px-4 py-2 rounded-lg bg-linear-to-r from-green-500 to-emerald-500 text-white font-medium disabled:opacity-50"
                    title="Apply custom array"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Array Size: {arraySize}
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={arraySize}
                  onChange={(e) => setArraySize(Number(e.target.value))}
                  disabled={racing}
                  className="w-full h-2 bg-linear-to-r from-indigo-500 to-cyan-500 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Animation Speed: {speed}
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full h-2 bg-linear-to-r from-yellow-500 to-amber-500 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex gap-2 items-end">
              <button
                onClick={startRace}
                disabled={selectedAlgos.length === 0}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-lg transition-all ${
                  racing
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                } shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {racing ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                {racing ? "Stop Race" : "Start Race!"}
              </button>
            </div>

            <div className="flex gap-2 items-end">
              <button
                onClick={
                  customArrayMode ? parseCustomArray : generateRandomArray
                }
                disabled={racing}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  darkMode
                    ? "bg-slate-700 hover:bg-slate-600 text-gray-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                } disabled:opacity-50 shadow-lg`}
              >
                <RotateCcw className="w-5 h-5" />
                {customArrayMode ? "Apply" : "New Array"}
              </button>
            </div>
          </div>
        </div>

        {/* Live Race Tracker */}
        {racing && (
          <div
            className={`${
              darkMode ? "bg-indigo-900/40" : "bg-indigo-100"
            } backdrop-blur-xl rounded-2xl p-6 mb-8 border ${
              darkMode ? "border-indigo-700/50" : "border-indigo-300"
            } shadow-lg`}
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <h3
                className={`text-xl font-bold ${
                  darkMode ? "text-indigo-200" : "text-indigo-800"
                }`}
              >
                Live Race Progress
              </h3>
            </div>

            {leader && (
              <div className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span
                  className={`${
                    darkMode ? "text-yellow-300" : "text-yellow-800"
                  }`}
                >
                  Currently Leading: {algorithms[leader].name}{" "}
                  {algorithms[leader].emoji}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedAlgos.map((algo) => {
                const state = arrays[algo];
                if (!state) return null;

                return (
                  <div
                    key={algo}
                    className={`${
                      darkMode ? "bg-slate-800/70" : "bg-white/70"
                    } rounded-xl p-4 border ${
                      darkMode ? "border-slate-700/50" : "border-gray-200/50"
                    }`}
                  >
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {algorithms[algo].emoji}
                        </span>
                        <span
                          className={`font-semibold ${
                            darkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {algorithms[algo].name}
                        </span>
                      </div>
                      <span
                        className={`font-bold ${
                          state.finished ? "text-green-400" : "text-yellow-400"
                        }`}
                      >
                        {state.finished
                          ? "🏁 Finished"
                          : `${Math.floor(state.progress)}%`}
                      </span>
                    </div>

                    <div className="w-full bg-gray-300/30 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 bg-linear-to-r ${algorithms[algo].color} transition-all`}
                        style={{ width: `${state.progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Race Leaderboard */}
        {raceResults.length > 0 && (
          <div
            className={`${
              darkMode
                ? "bg-linear-to-r from-yellow-900/50 to-amber-900/50"
                : "bg-linear-to-r from-yellow-100 to-amber-100"
            } backdrop-blur-xl rounded-2xl p-6 mb-8 border ${
              darkMode ? "border-yellow-700/50" : "border-yellow-300"
            } shadow-xl`}
          >
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <h3
                className={`text-2xl font-bold ${
                  darkMode ? "text-yellow-300" : "text-yellow-800"
                }`}
              >
                Race Results
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {raceResults.map((result, index) => (
                <div
                  key={result.algo}
                  className={`p-4 rounded-xl ${
                    index === 0
                      ? "bg-linear-to-br from-yellow-400 to-yellow-500 text-gray-900 scale-105"
                      : index === 1
                      ? "bg-linear-to-br from-gray-300 to-gray-400 text-gray-900"
                      : index === 2
                      ? "bg-linear-to-br from-orange-400 to-orange-500 text-gray-900"
                      : darkMode
                      ? "bg-slate-700"
                      : "bg-white"
                  } transition-all`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">
                      {algorithms[result.algo].emoji}
                    </span>
                    <span className="text-2xl font-bold">#{index + 1}</span>
                  </div>
                  <h4 className="font-bold text-lg mb-1">
                    {algorithms[result.algo].name}
                  </h4>
                  <p className="text-sm opacity-90">
                    Time: {result.timeTaken}ms
                  </p>
                  <p className="text-sm opacity-90">Steps: {result.steps}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Racing Tracks */}
        <div className="grid grid-cols-1 gap-6">
          {selectedAlgos.map((algo) => {
            const state = arrays[algo];
            if (!state) return null;

            return (
              <div
                key={algo}
                className={`${
                  darkMode ? "bg-slate-800/50" : "bg-white/50"
                } backdrop-blur-xl rounded-2xl p-6 border ${
                  darkMode ? "border-slate-700/50" : "border-gray-200/50"
                } shadow-xl`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{algorithms[algo].emoji}</span>
                    <div>
                      <h3
                        className={`text-xl font-bold bg-linear-to-r ${algorithms[algo].color} bg-clip-text text-transparent`}
                      >
                        {algorithms[algo].name}
                      </h3>
                      <div className="flex gap-4 text-sm">
                        <span
                          className={`${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Steps: {state.steps}
                        </span>
                        <span
                          className={`${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Time: {algorithms[algo].time}
                        </span>
                        <span
                          className={`${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Space: {algorithms[algo].space}
                        </span>
                      </div>
                    </div>
                  </div>
                  {state.finished && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 text-white font-bold">
                      <Zap className="w-5 h-5" />
                      FINISHED!
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-center gap-0.5 h-[200px] bg-linear-to-b from-transparent to-slate-900/20 rounded-lg p-4">
                  {state.array.map((value, idx) => (
                    <div
                      key={idx}
                      style={{
                        height: `${(value / maxValue) * 100}%`,
                        width: `${Math.max(100 / state.array.length, 2)}%`,
                      }}
                      className={`transition-all duration-75 rounded-t-sm ${
                        state.sorted.includes(idx)
                          ? `bg-linear-to-t ${algorithms[algo].color} opacity-100`
                          : state.swapping.includes(idx)
                          ? "bg-linear-to-t from-red-500 to-pink-400"
                          : state.comparing.includes(idx)
                          ? "bg-linear-to-t from-yellow-500 to-amber-400"
                          : "bg-linear-to-t from-gray-500 to-gray-400 opacity-60"
                      }`}
                      title={`${value}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Algorithm Details Modal */}
        {showDetails && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
              className={`${
                darkMode ? "bg-slate-800" : "bg-white"
              } rounded-2xl p-6 max-w-md w-full shadow-2xl`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">
                    {algorithms[showDetails].emoji}
                  </span>
                  <h3
                    className={`text-2xl font-bold bg-linear-to-r ${algorithms[showDetails].color} bg-clip-text text-transparent`}
                  >
                    {algorithms[showDetails].name}
                  </h3>
                </div>
                <button
                  onClick={() => setShowDetails(null)}
                  className={`p-2 rounded-lg ${
                    darkMode ? "hover:bg-slate-700" : "hover:bg-gray-100"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${
                    darkMode ? "bg-slate-700" : "bg-gray-100"
                  }`}
                >
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    } mb-1`}
                  >
                    Time Complexity
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {algorithms[showDetails].time}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    darkMode ? "bg-slate-700" : "bg-gray-100"
                  }`}
                >
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    } mb-1`}
                  >
                    Space Complexity
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {algorithms[showDetails].space}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    darkMode ? "bg-slate-700" : "bg-gray-100"
                  }`}
                >
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    } mb-2`}
                  >
                    How it works
                  </p>
                  <p
                    className={`${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {algorithms[showDetails].desc}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg bg-linear-to-r ${algorithms[showDetails].color}`}
                >
                  <p className="text-white font-medium">Best Use Cases:</p>
                  <ul className="text-white text-sm mt-2 space-y-1">
                    {showDetails === "bubble" && (
                      <>
                        <li>• Small datasets</li>
                        <li>• Nearly sorted arrays</li>
                        <li>• Educational purposes</li>
                      </>
                    )}
                    {showDetails === "selection" && (
                      <>
                        <li>• Small datasets</li>
                        <li>• Memory-constrained systems</li>
                        <li>• Simple implementation needed</li>
                      </>
                    )}
                    {showDetails === "insertion" && (
                      <>
                        <li>• Small to medium datasets</li>
                        <li>• Nearly sorted data</li>
                        <li>• Online sorting (streaming data)</li>
                      </>
                    )}
                    {showDetails === "merge" && (
                      <>
                        <li>• Large datasets</li>
                        <li>• Stable sorting required</li>
                        <li>• Linked lists</li>
                      </>
                    )}
                    {showDetails === "quick" && (
                      <>
                        <li>• Large datasets</li>
                        <li>• Average case performance critical</li>
                        <li>• In-place sorting preferred</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-8">
        <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Made with ❤ using React.js | Race & Compare Sorting Algorithms
        </p>
      </div>
    </div>
  );
};

export default App;
