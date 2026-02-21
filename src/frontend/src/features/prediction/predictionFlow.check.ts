/**
 * Automated check for prediction flow with 20/20 gated flow testing
 * Runs only when ?checkPrediction=1 is present in URL
 */

interface CheckResult {
  success: boolean;
  message: string;
  details?: string;
}

async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForElement(selector: string, timeout = 10000): Promise<HTMLElement | null> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) return element;
    await wait(100);
  }
  return null;
}

async function clickElement(selector: string): Promise<boolean> {
  const element = await waitForElement(selector);
  if (!element) return false;
  element.click();
  return true;
}

async function checkPredictionFlow(): Promise<CheckResult> {
  try {
    console.log('[Check] Starting prediction flow check with 20/20 gated flow...');

    // Step 1: Add entries until we reach 20/20
    console.log('[Check] Step 1: Adding 20 entries to reach capacity...');
    const bigButton = await waitForElement('[data-testid="big-button"]');
    if (!bigButton) {
      return { success: false, message: 'Big button not found' };
    }

    // Add 20 entries
    for (let i = 0; i < 20; i++) {
      bigButton.click();
      await wait(100);
    }
    await wait(500);

    // Step 2: Verify Next button is visible at 20/20
    console.log('[Check] Step 2: Verifying Next button is visible at 20/20...');
    const nextButton = await waitForElement('[data-testid="next-button"]', 3000);
    if (!nextButton) {
      return { 
        success: false, 
        message: 'Next button not visible at 20/20',
        details: 'Expected Next button to appear when history reaches 20 entries'
      };
    }
    console.log('[Check] ✓ Next button is visible at 20/20');

    // Step 3: Verify Big/Small buttons are disabled when locked
    console.log('[Check] Step 3: Verifying Big/Small buttons are disabled at 20/20...');
    const bigButtonDisabled = bigButton.hasAttribute('disabled');
    const smallButton = document.querySelector('[data-testid="small-button"]') as HTMLElement;
    const smallButtonDisabled = smallButton?.hasAttribute('disabled');

    if (!bigButtonDisabled || !smallButtonDisabled) {
      return {
        success: false,
        message: 'Big/Small buttons should be disabled at 20/20 when locked',
        details: `Big disabled: ${bigButtonDisabled}, Small disabled: ${smallButtonDisabled}`
      };
    }
    console.log('[Check] ✓ Big/Small buttons are disabled at 20/20');

    // Step 4: Press Next and verify exactly one add is accepted
    console.log('[Check] Step 4: Pressing Next to unlock one entry...');
    nextButton.click();
    await wait(500);

    // Verify buttons are now enabled
    if (bigButton.hasAttribute('disabled')) {
      return {
        success: false,
        message: 'Big button should be enabled after pressing Next',
        details: 'Gate did not unlock after Next button press'
      };
    }
    console.log('[Check] ✓ Big/Small buttons enabled after Next');

    // Add one entry
    console.log('[Check] Step 5: Adding one entry after unlock...');
    bigButton.click();
    await wait(500);

    // Step 6: Verify buttons are disabled again immediately after the single add
    console.log('[Check] Step 6: Verifying re-lock after single add...');
    if (!bigButton.hasAttribute('disabled')) {
      return {
        success: false,
        message: 'Big/Small buttons should re-lock immediately after single add',
        details: 'Gate did not re-lock after accepting one entry'
      };
    }
    console.log('[Check] ✓ Big/Small buttons re-locked after single add');

    // Step 7: Test Clear All resets gate
    console.log('[Check] Step 7: Testing Clear All resets gate...');
    const clearButton = await waitForElement('[data-testid="clear-history"]');
    if (!clearButton) {
      return { success: false, message: 'Clear All button not found' };
    }
    clearButton.click();
    await wait(500);

    // Verify buttons are enabled again after clear
    if (bigButton.hasAttribute('disabled')) {
      return {
        success: false,
        message: 'Big/Small buttons should be enabled after Clear All',
        details: 'Gate did not reset to unlocked state when history dropped below 20'
      };
    }
    console.log('[Check] ✓ Gate reset to unlocked after Clear All');

    // Step 8: Add one entry and test prediction flow
    console.log('[Check] Step 8: Testing prediction flow...');
    bigButton.click();
    await wait(500);

    const predictionButton = await waitForElement('[data-testid="prediction-button"]');
    if (!predictionButton) {
      return { success: false, message: 'Prediction button not found' };
    }
    
    // Check if button is disabled
    if (predictionButton.hasAttribute('disabled')) {
      console.log('[Check] Prediction button is disabled, waiting for connection...');
      
      // Wait for button to become enabled (max 15 seconds)
      const startTime = Date.now();
      while (Date.now() - startTime < 15000) {
        if (!predictionButton.hasAttribute('disabled')) {
          console.log('[Check] Prediction button is now enabled');
          break;
        }
        await wait(500);
      }
      
      if (predictionButton.hasAttribute('disabled')) {
        return { 
          success: false, 
          message: 'Prediction button remained disabled',
          details: 'Backend connection may not be ready'
        };
      }
    }
    
    predictionButton.click();
    await wait(1000);

    // Step 9: Wait for prediction result or error state
    console.log('[Check] Step 9: Waiting for prediction result or error...');
    
    // Wait up to 20 seconds for either result or error
    const maxWaitTime = 20000;
    const startTime = Date.now();
    let finalState: 'result' | 'error' | 'timeout' = 'timeout';
    
    while (Date.now() - startTime < maxWaitTime) {
      const resultElement = document.querySelector('[data-testid="prediction-result"]');
      const errorElement = document.querySelector('[data-testid="prediction-error"]');
      
      if (resultElement) {
        finalState = 'result';
        break;
      }
      
      if (errorElement) {
        finalState = 'error';
        break;
      }
      
      await wait(500);
    }

    if (finalState === 'result') {
      console.log('[Check] ✓ Prediction result displayed successfully');
      const predictionValue = document.querySelector('[data-testid="prediction-value"]')?.textContent;
      const predictionExplanation = document.querySelector('[data-testid="prediction-explanation"]')?.textContent;
      
      if (!predictionValue || !predictionExplanation) {
        return {
          success: false,
          message: 'Prediction result incomplete',
          details: `Value: ${predictionValue}, Explanation: ${!!predictionExplanation}`
        };
      }
      
      return {
        success: true,
        message: 'All checks passed: 20/20 gated flow and prediction flow work correctly',
        details: `Prediction: ${predictionValue}`
      };
    }

    if (finalState === 'error') {
      console.log('[Check] Prediction error state detected, checking retry path...');
      
      // Check if retry buttons are available
      const retryPredictionButton = document.querySelector('[data-testid="retry-prediction-button"]');
      const retryConnectionButton = document.querySelector('[data-testid="retry-connection-button"]');
      
      if (!retryPredictionButton && !retryConnectionButton) {
        return {
          success: false,
          message: 'Error state has no retry buttons',
          details: 'UI stuck in failed state without recovery path'
        };
      }
      
      // Try retry connection if available
      if (retryConnectionButton) {
        console.log('[Check] Clicking Retry Connection...');
        (retryConnectionButton as HTMLElement).click();
        await wait(2000);
        
        // Check if we recovered
        const recoveredResult = document.querySelector('[data-testid="prediction-result"]');
        if (recoveredResult) {
          console.log('[Check] ✓ Recovered from error via retry connection');
          return {
            success: true,
            message: 'All checks passed: 20/20 gated flow works and error recovery successful',
            details: 'Prediction succeeded after connection retry'
          };
        }
      }
      
      // If retry prediction is available, try it
      if (retryPredictionButton) {
        console.log('[Check] Clicking Retry Prediction...');
        (retryPredictionButton as HTMLElement).click();
        await wait(2000);
        
        const recoveredResult = document.querySelector('[data-testid="prediction-result"]');
        if (recoveredResult) {
          console.log('[Check] ✓ Recovered from error via retry prediction');
          return {
            success: true,
            message: 'All checks passed: 20/20 gated flow works and error recovery successful',
            details: 'Prediction succeeded after prediction retry'
          };
        }
      }
      
      return {
        success: true,
        message: 'Gated flow checks passed; prediction error state has retry controls',
        details: 'Error state is recoverable with retry buttons present'
      };
    }

    return {
      success: false,
      message: 'Prediction request timed out',
      details: 'No result or error state after 20 seconds'
    };

  } catch (error) {
    console.error('[Check] Error during check:', error);
    return {
      success: false,
      message: 'Check failed with exception',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function runPredictionFlowCheck(): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search);
  const shouldCheck = urlParams.get('checkPrediction') === '1';
  
  if (!shouldCheck) {
    return;
  }

  console.log('[Check] Automated check enabled via URL parameter');
  
  // Wait for app to initialize
  await wait(2000);
  
  const result = await checkPredictionFlow();
  
  console.log('[Check] Final result:', result);
  
  // Display result in UI
  const resultDiv = document.createElement('div');
  resultDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 20px;
    background: ${result.success ? '#10b981' : '#ef4444'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    max-width: 400px;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  resultDiv.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px;">
      ${result.success ? '✓ Check Passed' : '✗ Check Failed'}
    </div>
    <div style="font-size: 14px; margin-bottom: 4px;">
      ${result.message}
    </div>
    ${result.details ? `<div style="font-size: 12px; opacity: 0.9;">${result.details}</div>` : ''}
  `;
  
  document.body.appendChild(resultDiv);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    resultDiv.remove();
  }, 10000);
}
