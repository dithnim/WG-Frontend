import React from "react";

// use this simple function to automatically focus on the next input
function focusNextInput(el, prevId, nextId) {
  if (el.value.length === 0) {
    if (prevId) {
      document.getElementById(prevId).focus();
    }
  } else {
    if (nextId) {
      document.getElementById(nextId).focus();
    }
  }
}

document
  .querySelectorAll("[data-focus-input-init]")
  .forEach(function (element) {
    element.addEventListener("keyup", function () {
      const prevId = this.getAttribute("data-focus-input-prev");
      const nextId = this.getAttribute("data-focus-input-next");
      focusNextInput(this, prevId, nextId);
    });

    // Handle paste event to split the pasted code into each input
    element.addEventListener("paste", function (event) {
      event.preventDefault();
      const pasteData = (event.clipboardData || window.clipboardData).getData(
        "text"
      );
      const digits = pasteData.replace(/\D/g, ""); // Only take numbers from the pasted data

      // Get all input fields
      const inputs = document.querySelectorAll("[data-focus-input-init]");

      // Iterate over the inputs and assign values from the pasted string
      inputs.forEach((input, index) => {
        if (digits[index]) {
          input.value = digits[index];
          // Focus the next input after filling the current one
          const nextId = input.getAttribute("data-focus-input-next");
          if (nextId) {
            document.getElementById(nextId).focus();
          }
        }
      });
    });
  });

const OtpInput = () => {
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
              maxLength="1"
              data-focus-input-init
              data-focus-input-next="code-2"
              id="code-1"
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
              maxLength="1"
              data-focus-input-init
              data-focus-input-prev="code-1"
              data-focus-input-next="code-3"
              id="code-2"
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
              maxLength="1"
              data-focus-input-init
              data-focus-input-prev="code-2"
              data-focus-input-next="code-4"
              id="code-3"
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
              maxLength="1"
              data-focus-input-init
              data-focus-input-prev="code-3"
              data-focus-input-next="code-5"
              id="code-4"
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
              maxLength="1"
              data-focus-input-init
              data-focus-input-prev="code-4"
              data-focus-input-next="code-6"
              id="code-5"
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
              maxLength="1"
              data-focus-input-init
              data-focus-input-prev="code-5"
              id="code-6"
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
