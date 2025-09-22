import React, { useEffect } from "react";

interface OtpInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// use this simple function to automatically focus on the next input
function focusNextInput(
  el: HTMLInputElement,
  prevId?: string,
  nextId?: string
) {
  if (el.value.length === 0) {
    if (prevId) {
      const prevElement = document.getElementById(prevId) as HTMLInputElement;
      prevElement?.focus();
    }
  } else {
    if (nextId) {
      const nextElement = document.getElementById(nextId) as HTMLInputElement;
      nextElement?.focus();
    }
  }
}

const OtpInput: React.FC<OtpInputProps> = ({ value, onChange }) => {
  useEffect(() => {
    // Only handle paste events since regular input is handled by onChange
    const handlePaste = (event: ClipboardEvent) => {
      event.preventDefault();
      const pasteData = event.clipboardData?.getData("text") || "";
      const digits = pasteData.replace(/\D/g, ""); // Only take numbers from the pasted data

      if (digits.length > 0) {
        // Update the OTP value with pasted digits (up to 6 digits)
        const newOtp = digits.slice(0, 6).padEnd(6, "");
        const syntheticEvent = {
          target: { name: "otp", value: newOtp.trim() },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);

        // Focus the appropriate input after paste
        const focusIndex = Math.min(digits.length, 6);
        if (focusIndex < 6) {
          const nextInput = document.getElementById(
            `code-${focusIndex + 1}`
          ) as HTMLInputElement;
          nextInput?.focus();
        }
      }
    };

    // Add paste listener to all inputs
    const elements = document.querySelectorAll("[data-focus-input-init]");
    elements.forEach((element) => {
      element.addEventListener("paste", handlePaste);
    });

    // Cleanup function
    return () => {
      elements.forEach((element) => {
        element.removeEventListener("paste", handlePaste);
      });
    };
  }, [onChange]);

  // Split the value into individual digits for each input
  const digits = value.padEnd(6, " ").split("").slice(0, 6);
  return (
    <>
      <form className="max-w-sm mx-auto">
        <div className="flex mb-2 space-x-2 rtl:space-x-reverse">
          <div>
            <label htmlFor="code-1" className="sr-only">
              First code
            </label>
            <input
              type="text"
              maxLength={1}
              data-focus-input-init
              data-focus-input-next="code-2"
              id="code-1"
              value={digits[0] === " " ? "" : digits[0]}
              onChange={(e) => {
                const newValue = e.target.value;
                if (/^\d?$/.test(newValue)) {
                  // Only allow single digits
                  const newOtp = newValue + value.slice(1);
                  const syntheticEvent = {
                    target: { name: "otp", value: newOtp.slice(0, 6) },
                  } as React.ChangeEvent<HTMLInputElement>;
                  onChange(syntheticEvent);

                  // Auto-focus next input if digit entered
                  if (newValue && newValue !== digits[0]) {
                    const nextInput = document.getElementById(
                      "code-2"
                    ) as HTMLInputElement;
                    nextInput?.focus();
                  }
                }
              }}
              className="block w-9 h-9 py-3 text-sm font-extrabold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-[#262626] dark:border-neutral-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label htmlFor="code-2" className="sr-only">
              Second code
            </label>
            <input
              type="text"
              maxLength={1}
              data-focus-input-init
              data-focus-input-prev="code-1"
              data-focus-input-next="code-3"
              id="code-2"
              value={digits[1] === " " ? "" : digits[1]}
              onChange={(e) => {
                const newValue = e.target.value;
                if (/^\d?$/.test(newValue)) {
                  const newOtp = value.slice(0, 1) + newValue + value.slice(2);
                  const syntheticEvent = {
                    target: { name: "otp", value: newOtp.slice(0, 6) },
                  } as React.ChangeEvent<HTMLInputElement>;
                  onChange(syntheticEvent);

                  if (newValue && newValue !== digits[1]) {
                    const nextInput = document.getElementById(
                      "code-3"
                    ) as HTMLInputElement;
                    nextInput?.focus();
                  } else if (!newValue) {
                    const prevInput = document.getElementById(
                      "code-1"
                    ) as HTMLInputElement;
                    prevInput?.focus();
                  }
                }
              }}
              className="block w-9 h-9 py-3 text-sm font-extrabold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-[#262626] dark:border-neutral-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label htmlFor="code-3" className="sr-only">
              Third code
            </label>
            <input
              type="text"
              maxLength={1}
              data-focus-input-init
              data-focus-input-prev="code-2"
              data-focus-input-next="code-4"
              id="code-3"
              value={digits[2] === " " ? "" : digits[2]}
              onChange={(e) => {
                const newValue = e.target.value;
                if (/^\d?$/.test(newValue)) {
                  const newOtp = value.slice(0, 2) + newValue + value.slice(3);
                  const syntheticEvent = {
                    target: { name: "otp", value: newOtp.slice(0, 6) },
                  } as React.ChangeEvent<HTMLInputElement>;
                  onChange(syntheticEvent);

                  if (newValue && newValue !== digits[2]) {
                    const nextInput = document.getElementById(
                      "code-4"
                    ) as HTMLInputElement;
                    nextInput?.focus();
                  } else if (!newValue) {
                    const prevInput = document.getElementById(
                      "code-2"
                    ) as HTMLInputElement;
                    prevInput?.focus();
                  }
                }
              }}
              className="block w-9 h-9 py-3 text-sm font-extrabold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-[#262626] dark:border-neutral-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label htmlFor="code-4" className="sr-only">
              Fourth code
            </label>
            <input
              type="text"
              maxLength={1}
              data-focus-input-init
              data-focus-input-prev="code-3"
              data-focus-input-next="code-5"
              id="code-4"
              value={digits[3] === " " ? "" : digits[3]}
              onChange={(e) => {
                const newValue = e.target.value;
                if (/^\d?$/.test(newValue)) {
                  const newOtp = value.slice(0, 3) + newValue + value.slice(4);
                  const syntheticEvent = {
                    target: { name: "otp", value: newOtp.slice(0, 6) },
                  } as React.ChangeEvent<HTMLInputElement>;
                  onChange(syntheticEvent);

                  if (newValue && newValue !== digits[3]) {
                    const nextInput = document.getElementById(
                      "code-5"
                    ) as HTMLInputElement;
                    nextInput?.focus();
                  } else if (!newValue) {
                    const prevInput = document.getElementById(
                      "code-3"
                    ) as HTMLInputElement;
                    prevInput?.focus();
                  }
                }
              }}
              className="block w-9 h-9 py-3 text-sm font-extrabold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-[#262626] dark:border-neutral-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label htmlFor="code-5" className="sr-only">
              Fifth code
            </label>
            <input
              type="text"
              maxLength={1}
              data-focus-input-init
              data-focus-input-prev="code-4"
              data-focus-input-next="code-6"
              id="code-5"
              value={digits[4] === " " ? "" : digits[4]}
              onChange={(e) => {
                const newValue = e.target.value;
                if (/^\d?$/.test(newValue)) {
                  const newOtp = value.slice(0, 4) + newValue + value.slice(5);
                  const syntheticEvent = {
                    target: { name: "otp", value: newOtp.slice(0, 6) },
                  } as React.ChangeEvent<HTMLInputElement>;
                  onChange(syntheticEvent);

                  if (newValue && newValue !== digits[4]) {
                    const nextInput = document.getElementById(
                      "code-6"
                    ) as HTMLInputElement;
                    nextInput?.focus();
                  } else if (!newValue) {
                    const prevInput = document.getElementById(
                      "code-4"
                    ) as HTMLInputElement;
                    prevInput?.focus();
                  }
                }
              }}
              className="block w-9 h-9 py-3 text-sm font-extrabold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-[#262626] dark:border-neutral-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label htmlFor="code-6" className="sr-only">
              Sixth code
            </label>
            <input
              type="text"
              maxLength={1}
              data-focus-input-init
              data-focus-input-prev="code-5"
              id="code-6"
              value={digits[5] === " " ? "" : digits[5]}
              onChange={(e) => {
                const newValue = e.target.value;
                if (/^\d?$/.test(newValue)) {
                  const newOtp = value.slice(0, 5) + newValue;
                  const syntheticEvent = {
                    target: { name: "otp", value: newOtp.slice(0, 6) },
                  } as React.ChangeEvent<HTMLInputElement>;
                  onChange(syntheticEvent);

                  if (!newValue) {
                    const prevInput = document.getElementById(
                      "code-5"
                    ) as HTMLInputElement;
                    prevInput?.focus();
                  }
                }
              }}
              className="block w-9 h-9 py-3 text-sm font-extrabold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-[#262626] dark:border-neutral-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              required
            />
          </div>
        </div>
        <p
          id="helper-text-explanation"
          className="mt-2 text-sm text-gray-500 dark:text-gray-400"
        >
          Please introduce the 6-digit code we sent via email.
        </p>
      </form>
    </>
  );
};

export default OtpInput;
