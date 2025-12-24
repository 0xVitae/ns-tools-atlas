"use client";

/**
 * @author: @kokonutui
 * @description: A modern search bar component with action buttons and suggestions
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import { Search, Send } from "lucide-react";
import useDebounce from "@/hooks/use-debounce";

export interface Action {
    id: string;
    label: string;
    icon: React.ReactNode;
    description?: string;
    short?: string;
    end?: string;
}

interface SearchResult {
    actions: Action[];
}

const ANIMATION_VARIANTS = {
    container: {
        hidden: { opacity: 0, height: 0 },
        show: {
            opacity: 1,
            height: "auto",
            transition: {
                height: { duration: 0.4 },
                staggerChildren: 0.1,
            },
        },
        exit: {
            opacity: 0,
            height: 0,
            transition: {
                height: { duration: 0.3 },
                opacity: { duration: 0.2 },
            },
        },
    },
    item: {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3 },
        },
        exit: {
            opacity: 0,
            y: -10,
            transition: { duration: 0.2 },
        },
    },
} as const;

function ActionSearchBar({
    actions = [],
    defaultOpen = false,
    placeholder = "Search...",
    onSelect,
}: {
    actions?: Action[];
    defaultOpen?: boolean;
    placeholder?: string;
    onSelect?: (action: Action) => void;
}) {
    const [query, setQuery] = useState("");
    const [result, setResult] = useState<SearchResult | null>(null);
    const [isFocused, setIsFocused] = useState(defaultOpen);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedAction, setSelectedAction] = useState<Action | null>(null);
    const [activeIndex, setActiveIndex] = useState(-1);
    const debouncedQuery = useDebounce(query, 200);

    const filteredActions = useMemo(() => {
        if (!debouncedQuery) return actions;

        const normalizedQuery = debouncedQuery.toLowerCase().trim();
        return actions.filter((action) => {
            const searchableText =
                `${action.label} ${action.description || ""}`.toLowerCase();
            return searchableText.includes(normalizedQuery);
        });
    }, [debouncedQuery, actions]);

    useEffect(() => {
        if (!isFocused) {
            setResult(null);
            setActiveIndex(-1);
            return;
        }

        setResult({ actions: filteredActions });
        setActiveIndex(-1);
    }, [filteredActions, isFocused]);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setQuery(e.target.value);
            setIsTyping(true);
            setActiveIndex(-1);
        },
        []
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (!result?.actions.length) return;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setActiveIndex((prev) =>
                        prev < result.actions.length - 1 ? prev + 1 : 0
                    );
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setActiveIndex((prev) =>
                        prev > 0 ? prev - 1 : result.actions.length - 1
                    );
                    break;
                case "Enter":
                    e.preventDefault();
                    if (activeIndex >= 0 && result.actions[activeIndex]) {
                        const action = result.actions[activeIndex];
                        setSelectedAction(action);
                        onSelect?.(action);
                        setIsFocused(false);
                        setQuery("");
                    }
                    break;
                case "Escape":
                    setIsFocused(false);
                    setActiveIndex(-1);
                    break;
            }
        },
        [result?.actions, activeIndex, onSelect]
    );

    const handleActionClick = useCallback((action: Action) => {
        setSelectedAction(action);
        onSelect?.(action);
        setIsFocused(false);
        setQuery("");
    }, [onSelect]);

    const handleFocus = useCallback(() => {
        setSelectedAction(null);
        setIsFocused(true);
        setActiveIndex(-1);
    }, []);

    const handleBlur = useCallback(() => {
        setTimeout(() => {
            setIsFocused(false);
            setActiveIndex(-1);
        }, 200);
    }, []);

    return (
        <motion.div
            className="relative"
            initial={false}
            animate={{ width: isFocused ? 320 : 192 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    role="combobox"
                    aria-expanded={isFocused && !!result}
                    aria-autocomplete="list"
                    aria-activedescendant={
                        activeIndex >= 0
                            ? `action-${result?.actions[activeIndex]?.id}`
                            : undefined
                    }
                    id="search"
                    autoComplete="off"
                    className="pl-8 pr-3 h-8 text-sm rounded-lg border-border/60 focus:border-foreground/30 focus-visible:ring-offset-0"
                />
            </div>

            <AnimatePresence>
                {isFocused && result && result.actions.length > 0 && !selectedAction && (
                    <motion.div
                        className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg overflow-hidden bg-white dark:bg-black z-50 max-h-64 overflow-y-auto"
                        variants={ANIMATION_VARIANTS.container}
                        role="listbox"
                        aria-label="Search results"
                        initial="hidden"
                        animate="show"
                        exit="exit"
                    >
                        <motion.ul role="none">
                            {result.actions.slice(0, 8).map((action) => (
                                <motion.li
                                    key={action.id}
                                    id={`action-${action.id}`}
                                    className={`px-3 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-zinc-900 cursor-pointer ${
                                        activeIndex ===
                                        result.actions.indexOf(action)
                                            ? "bg-gray-100 dark:bg-zinc-800"
                                            : ""
                                    }`}
                                    variants={ANIMATION_VARIANTS.item}
                                    layout
                                    onClick={() =>
                                        handleActionClick(action)
                                    }
                                    role="option"
                                    aria-selected={
                                        activeIndex ===
                                        result.actions.indexOf(action)
                                    }
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="text-gray-500 flex-shrink-0"
                                            aria-hidden="true"
                                        >
                                            {action.icon}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {action.label}
                                        </span>
                                    </div>
                                    {action.end && (
                                        <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">
                                            {action.end}
                                        </span>
                                    )}
                                </motion.li>
                            ))}
                        </motion.ul>
                        {result.actions.length > 8 && (
                            <div className="px-3 py-1.5 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 text-center">
                                +{result.actions.length - 8} more results
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default ActionSearchBar;
