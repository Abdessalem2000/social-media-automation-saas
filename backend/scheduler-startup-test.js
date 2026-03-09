/**
 * Independent Scheduler Startup Test
 * Tests scheduler initialization and startup detection logic
 */

const cron = require('node-cron');

// Test Scheduler Service
class TestSchedulerService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.startTime = null;
    this.concurrencyLimit = 5;
    this.activeJobs = new Set();
    this.processingHistory = [];
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler is already running');
      return false;
    }
    
    this.isRunning = true;
    this.startTime = Date.now();
    
    console.log('🚀 SCHEDULER STARTUP INITIALIZED');
    console.log(`   ✅ isRunning flag set: ${this.isRunning}`);
    console.log(`   ✅ startTime recorded: ${new Date(this.startTime).toISOString()}`);
    console.log(`   ✅ Cron job scheduling: */10 * * * * *`);
    
    // Run every 10 seconds for testing
    this.cronJob = cron.schedule('*/10 * * * * *', async () => {
      console.log('🔄 Scheduler tick - processing scheduled posts');
    }, {
      scheduled: true
    });
    
    console.log('🚀 SCHEDULER STARTUP COMPLETED');
    console.log(`⚡ Concurrency limit: ${this.concurrencyLimit} posts`);
    console.log(`📅 Next run: Every 10 seconds`);
    
    return true;
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Scheduler is not running');
      return false;
    }
    
    console.log('🛑 SCHEDULER SHUTDOWN INITIATED');
    console.log(`   ✅ isRunning before stop: ${this.isRunning}`);
    console.log(`   ✅ Active jobs to complete: ${this.activeJobs.size}`);
    
    this.isRunning = false;
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    
    console.log('🛑 SCHEDULER SHUTDOWN COMPLETED');
    console.log(`   ✅ isRunning after stop: ${this.isRunning}`);
    console.log(`   ✅ Cron job stopped`);
    console.log(`   ✅ Final uptime: ${((Date.now() - this.startTime) / 1000).toFixed(2)}s`);
    
    return true;
  }

  getStats() {
    const uptime = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    
    return {
      isRunning: this.isRunning,
      uptime,
      nextRun: this.isRunning ? 'Every 10 seconds' : 'Not running',
      processedJobs: 0,
      failedJobs: 0,
      activeJobs: this.activeJobs.size,
      concurrencyLimit: this.concurrencyLimit,
      averageProcessingTime: 0,
      processingHistory: this.processingHistory.slice(-10),
      memory: process.memoryUsage(),
      startTime: this.startTime
    };
  }
}

// Test runner
async function runSchedulerStartupTest() {
  console.log('🚀 SCHEDULER STARTUP DETECTION TEST');
  console.log('==================================');
  console.log('📊 Testing scheduler initialization and startup logic');
  console.log('🔍 Verifying proper startup detection and status reporting');

  const scheduler = new TestSchedulerService();
  const testResults = {};

  try {
    // Test 1: Initial state
    console.log('\n🧪 Test 1: Initial State');
    console.log('========================');
    
    const initialStats = scheduler.getStats();
    testResults.initialState = {
      isRunningFalse: !initialStats.isRunning,
      uptimeZero: initialStats.uptime === 0,
      nextRunNotRunning: initialStats.nextRun === 'Not running',
      startTimeNull: initialStats.startTime === null
    };
    
    console.log(`   isRunning: ${initialStats.isRunning} (expected: false)`);
    console.log(`   uptime: ${initialStats.uptime}s (expected: 0)`);
    console.log(`   nextRun: ${initialStats.nextRun} (expected: 'Not running')`);
    console.log(`   startTime: ${initialStats.startTime} (expected: null)`);
    console.log(`   ✅ Initial state test: ${testResults.initialState.isRunningFalse && testResults.initialState.uptimeZero ? 'PASS' : 'FAIL'}`);

    // Test 2: Startup detection
    console.log('\n🧪 Test 2: Startup Detection');
    console.log('=============================');
    
    const startResult = scheduler.start();
    
    // Wait a bit for startup to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const finalStartStats = scheduler.getStats();
    
    testResults.startupDetection = {
      startMethodReturned: startResult === true,
      isRunningTrue: finalStartStats.isRunning === true,
      uptimePositive: finalStartStats.uptime > 0,
      nextRunScheduled: finalStartStats.nextRun === 'Every 10 seconds',
      startTimeSet: finalStartStats.startTime !== null
    };
    
    console.log(`   start() returned: ${startResult} (expected: true)`);
    console.log(`   isRunning: ${finalStartStats.isRunning} (expected: true)`);
    console.log(`   uptime: ${finalStartStats.uptime.toFixed(2)}s (expected: > 0)`);
    console.log(`   nextRun: ${finalStartStats.nextRun} (expected: 'Every 10 seconds')`);
    console.log(`   startTime: ${finalStartStats.startTime ? 'SET' : 'NULL'} (expected: SET)`);
    console.log(`   ✅ Startup detection test: ${Object.values(testResults.startupDetection).every(v => v) ? 'PASS' : 'FAIL'}`);

    // Test 3: Running state consistency
    console.log('\n🧪 Test 3: Running State Consistency');
    console.log('===================================');
    
    // Wait for a few seconds to test consistency
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const consistentStats = scheduler.getStats();
    
    testResults.runningConsistency = {
      isRunningConsistent: consistentStats.isRunning === true,
      uptimeIncreasing: consistentStats.uptime > finalStartStats.uptime,
      nextRunConsistent: consistentStats.nextRun === 'Every 10 seconds',
      startTimeUnchanged: consistentStats.startTime === finalStartStats.startTime
    };
    
    console.log(`   isRunning: ${consistentStats.isRunning} (expected: true)`);
    console.log(`   uptime increased: ${consistentStats.uptime.toFixed(2)}s > ${finalStartStats.uptime.toFixed(2)}s (expected: true)`);
    console.log(`   nextRun: ${consistentStats.nextRun} (expected: 'Every 10 seconds')`);
    console.log(`   startTime unchanged: ${consistentStats.startTime === finalStartStats.startTime} (expected: true)`);
    console.log(`   ✅ Running consistency test: ${Object.values(testResults.runningConsistency).every(v => v) ? 'PASS' : 'FAIL'}`);

    // Test 4: Shutdown detection
    console.log('\n🧪 Test 4: Shutdown Detection');
    console.log('============================');
    
    const stopResult = scheduler.stop();
    const afterStopStats = scheduler.getStats();
    
    testResults.shutdownDetection = {
      stopMethodReturned: stopResult === true,
      isRunningFalse: afterStopStats.isRunning === false,
      uptimePreserved: afterStopStats.uptime > 0,
      nextRunNotRunning: afterStopStats.nextRun === 'Not running',
      startTimePreserved: afterStopStats.startTime !== null
    };
    
    console.log(`   stop() returned: ${stopResult} (expected: true)`);
    console.log(`   isRunning: ${afterStopStats.isRunning} (expected: false)`);
    console.log(`   uptime preserved: ${afterStopStats.uptime.toFixed(2)}s (expected: > 0)`);
    console.log(`   nextRun: ${afterStopStats.nextRun} (expected: 'Not running')`);
    console.log(`   startTime preserved: ${afterStopStats.startTime ? 'PRESERVED' : 'NULL'} (expected: PRESERVED)`);
    console.log(`   ✅ Shutdown detection test: ${Object.values(testResults.shutdownDetection).every(v => v) ? 'PASS' : 'FAIL'}`);

    // Test 5: Multiple start/stop cycles
    console.log('\n🧪 Test 5: Multiple Start/Stop Cycles');
    console.log('====================================');
    
    let cyclesPassed = 0;
    const cyclesToTest = 3;
    
    for (let i = 0; i < cyclesToTest; i++) {
      console.log(`   Cycle ${i + 1}/${cyclesToTest}:`);
      
      const start1 = scheduler.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      const stats1 = scheduler.getStats();
      
      const stop1 = scheduler.stop();
      const stats2 = scheduler.getStats();
      
      const cyclePassed = start1 === true && stats1.isRunning === true && 
                        stop1 === true && stats2.isRunning === false;
      
      if (cyclePassed) cyclesPassed++;
      
      console.log(`     Start: ${start1}, Running: ${stats1.isRunning}, Stop: ${stop1}, Stopped: ${stats2.isRunning} - ${cyclePassed ? 'PASS' : 'FAIL'}`);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    testResults.multipleCycles = {
      cyclesPassed: cyclesPassed,
      allCyclesPassed: cyclesPassed === cyclesToTest
    };
    
    console.log(`   ✅ Multiple cycles test: ${cyclesPassed}/${cyclesToTest} cycles passed - ${testResults.multipleCycles.allCyclesPassed ? 'PASS' : 'FAIL'}`);

    // Generate final report
    console.log('\n📋 STARTUP DETECTION TEST REPORT');
    console.log('=================================');
    
    const allTests = [
      { name: 'Initial State', passed: Object.values(testResults.initialState).every(v => v) },
      { name: 'Startup Detection', passed: Object.values(testResults.startupDetection).every(v => v) },
      { name: 'Running Consistency', passed: Object.values(testResults.runningConsistency).every(v => v) },
      { name: 'Shutdown Detection', passed: Object.values(testResults.shutdownDetection).every(v => v) },
      { name: 'Multiple Cycles', passed: testResults.multipleCycles.allCyclesPassed }
    ];
    
    allTests.forEach(test => {
      console.log(`   ${test.passed ? '✅ PASS' : '❌ FAIL'} ${test.name}`);
    });
    
    const passedTests = allTests.filter(t => t.passed).length;
    const totalTests = allTests.length;
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL STARTUP DETECTION TESTS PASSED!');
      console.log('✅ Scheduler initialization logic working correctly');
      console.log('✅ Startup detection functioning properly');
      console.log('✅ State management consistent');
      console.log('✅ Shutdown detection working');
      console.log('✅ Multiple cycles handling working');
    } else {
      console.log('❌ Some startup detection tests failed');
      console.log('⚠️ Review the logs above for details');
    }

    return {
      success: passedTests === totalTests,
      results: testResults,
      summary: {
        passed: passedTests,
        total: totalTests,
        percentage: (passedTests / totalTests) * 100
      }
    };

  } catch (error) {
    console.log('❌ Startup detection test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
if (require.main === module) {
  runSchedulerStartupTest()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { TestSchedulerService, runSchedulerStartupTest };
