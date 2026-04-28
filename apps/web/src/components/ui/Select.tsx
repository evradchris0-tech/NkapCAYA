'use client';

import {
  forwardRef, useState, useRef, useEffect, useCallback,
  Children, isValidElement,
} from 'react';
import type { SelectHTMLAttributes, ReactNode } from 'react';
import { ChevronDown, AlertCircle, Check } from 'lucide-react';
import { clsx } from 'clsx';

/* ------------------------------------------------------------------ */
/* Option extraction                                                     */
/* ------------------------------------------------------------------ */

interface OptionItem {
  value: string;
  label: string;
  disabled?: boolean;
}

function extractOptions(children: ReactNode): OptionItem[] {
  const opts: OptionItem[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === 'option') {
      const p = child.props as {
        value?: string | number;
        children?: ReactNode;
        disabled?: boolean;
      };
      opts.push({
        value: String(p.value ?? ''),
        label: Array.isArray(p.children)
          ? p.children.join('')
          : String(p.children ?? ''),
        disabled: p.disabled,
      });
    }
  });
  return opts;
}

/* ------------------------------------------------------------------ */
/* Props                                                                 */
/* ------------------------------------------------------------------ */

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'multiple' | 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md';
}

/* ------------------------------------------------------------------ */
/* Component                                                             */
/* ------------------------------------------------------------------ */

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      className,
      id,
      children,
      value,
      defaultValue,
      onChange,
      onBlur,
      name,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const nativeRef = useRef<HTMLSelectElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    const options = extractOptions(children);
    const isControlled = value !== undefined;

    const [internalValue, setInternalValue] = useState(
      String(isControlled ? value : (defaultValue ?? '')),
    );

    /* Sync when controlled value changes (e.g., after reset()) */
    useEffect(() => {
      if (isControlled) setInternalValue(String(value ?? ''));
    }, [isControlled, value]);

    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    /* Label shown in the trigger button */
    const selectedOption = options.find((o) => o.value === internalValue);
    const isPlaceholder = !internalValue || !selectedOption || !selectedOption.value;

    /* ── Select an option ─────────────────────────────────────── */
    const handleSelect = useCallback(
      (optValue: string) => {
        if (disabled) return;
        setInternalValue(optValue);

        /* Keep hidden native select in sync (for RHF ref reads on submit) */
        if (nativeRef.current) {
          nativeRef.current.value = optValue;
        }

        /* Synthetic event — React Hook Form reads event.target.value */
        const syntheticEvent = {
          target: { value: optValue, name: name ?? '' },
          currentTarget: { value: optValue, name: name ?? '' },
          type: 'change',
          bubbles: true,
          cancelable: false,
          defaultPrevented: false,
          persist: () => {},
          preventDefault: () => {},
          stopPropagation: () => {},
          isDefaultPrevented: () => false,
          isPropagationStopped: () => false,
          nativeEvent: new Event('change'),
        } as unknown as React.ChangeEvent<HTMLSelectElement>;

        onChange?.(syntheticEvent);
        setIsOpen(false);
      },
      [disabled, name, onChange],
    );

    /* ── Close on outside click ──────────────────────────────── */
    useEffect(() => {
      if (!isOpen) return;
      function onMouseDown(e: MouseEvent) {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          setIsOpen(false);
          onBlur?.({} as React.FocusEvent<HTMLSelectElement>);
        }
      }
      document.addEventListener('mousedown', onMouseDown);
      return () => document.removeEventListener('mousedown', onMouseDown);
    }, [isOpen, onBlur]);

    /* ── Keyboard: Escape closes ─────────────────────────────── */
    useEffect(() => {
      if (!isOpen) return;
      function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          setIsOpen(false);
          onBlur?.({} as React.FocusEvent<HTMLSelectElement>);
        }
      }
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onBlur]);

    return (
      <div className={clsx('flex flex-col gap-1.5', className)}>
        {label && (
          <label
            htmlFor={`${selectId}-btn`}
            className="text-sm font-medium text-gray-700 select-none"
          >
            {label}
          </label>
        )}

        <div className={clsx('relative', isOpen && 'z-50')} ref={wrapperRef}>
          {/* Hidden native select — owns the ref so RHF can read .value on submit */}
          <select
            ref={(el) => {
              nativeRef.current = el;
              if (typeof ref === 'function') ref(el);
              else if (ref) (ref as React.MutableRefObject<HTMLSelectElement | null>).current = el;
            }}
            id={selectId}
            name={name}
            value={internalValue}
            onChange={() => {/* controlled by custom UI */}}
            className="sr-only"
            tabIndex={-1}
            style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
            {...rest}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* ── Trigger button ─────────────────────────────────── */}
          <button
            type="button"
            id={`${selectId}-btn`}
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={`${selectId}-list`}
            disabled={disabled}
            onClick={() => !disabled && setIsOpen((v) => !v)}
            className={clsx(
              'w-full flex items-center gap-2 text-sm border bg-white',
              size === 'sm' ? 'px-2.5 py-1.5 rounded-lg' : 'px-3.5 py-2.5 rounded-xl',
              'transition-all duration-150 shadow-sm outline-none',
              'focus:ring-2 focus:ring-offset-0 focus:border-transparent',
              isOpen
                ? 'border-blue-400 ring-2 ring-blue-100 text-blue-700'
                : error
                ? 'border-red-300 bg-red-50/20 focus:ring-red-400'
                : 'border-gray-200 text-gray-900 hover:border-gray-300 hover:shadow focus:border-blue-300 focus:ring-blue-100',
              disabled && 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-60 pointer-events-none',
            )}
          >
            <span className={clsx('flex-1 truncate', isPlaceholder && 'text-gray-400')}>
              {selectedOption?.label ?? ''}
            </span>
            {error ? (
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" aria-hidden />
            ) : (
              <ChevronDown
                className={clsx(
                  'h-4 w-4 text-gray-400 shrink-0 transition-transform duration-150',
                  isOpen && 'rotate-180',
                )}
                aria-hidden
              />
            )}
          </button>

          {/* ── Dropdown panel ─────────────────────────────────── */}
          {isOpen && (
            <div
              id={`${selectId}-list`}
              className="absolute left-0 top-full mt-1.5 w-full min-w-[10rem] bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden py-1 max-h-64 overflow-y-auto"
            >
              <ul role="listbox" aria-label={label}>
                {options.map((opt) => {
                  const isSelected = opt.value === internalValue;
                  const isEmpty = !opt.value;
                  return (
                    <li key={opt.value} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        disabled={opt.disabled}
                        onClick={() => !opt.disabled && handleSelect(opt.value)}
                        className={clsx(
                          'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors text-sm',
                          isSelected
                            ? 'bg-blue-50 text-blue-700'
                            : isEmpty
                            ? 'text-gray-400 hover:bg-gray-50'
                            : 'text-gray-700 hover:bg-gray-50',
                          opt.disabled && 'opacity-40 cursor-not-allowed',
                        )}
                      >
                        <div
                          className={clsx(
                            'w-2 h-2 rounded-full shrink-0',
                            isSelected
                              ? 'bg-blue-500'
                              : 'bg-transparent border border-gray-300',
                          )}
                        />
                        <span className={clsx('flex-1 truncate', isEmpty && 'italic')}>
                          {opt.label}
                        </span>
                        {isSelected && !isEmpty && (
                          <Check className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <span aria-hidden>⚠</span>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-gray-400">{helperText}</p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
export default Select;
