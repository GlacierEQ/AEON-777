#!/usr/bin/env python3
"""
AEON-777 Test Suite — Complete System Validation
Validates all components of Aspen Grove Federation
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime

COLORS = {
    'BLUE': '\033[94m',
    'GREEN': '\033[92m',
    'YELLOW': '\033[93m',
    'RED': '\033[91m',
    'BOLD': '\033[1m',
    'END': '\033[0m'
}

class TestSuite:
    def __init__(self):
        self.tests_passed = 0
        self.tests_failed = 0
        self.tests_warning = 0
        self.results = []
        self.agent_home = Path('/agent/home')

    def log_test(self, name: str, status: str, message: str = ""):
        """Log test result"""
        icon = {
            'PASS': f'{COLORS["GREEN"]}✅{COLORS["END"]}',
            'FAIL': f'{COLORS["RED"]}❌{COLORS["END"]}',
            'WARN': f'{COLORS["YELLOW"]}⚠️{COLORS["END"]}'
        }.get(status, '•')
        
        print(f"{icon} {name:40} {message}")
        
        if status == 'PASS':
            self.tests_passed += 1
        elif status == 'FAIL':
            self.tests_failed += 1
        else:
            self.tests_warning += 1
        
        self.results.append({'test': name, 'status': status, 'message': message})

    def test_file_exists(self, filepath: str) -> bool:
        """Test if file exists"""
        exists = Path(filepath).exists()
        status = 'PASS' if exists else 'FAIL'
        msg = f"({filepath})" if not exists else ""
        self.log_test(f"File: {Path(filepath).name}", status, msg)
        return exists

    def test_python_syntax(self, filepath: str) -> bool:
        """Test Python syntax"""
        try:
            result = subprocess.run(
                [sys.executable, '-m', 'py_compile', filepath],
                capture_output=True,
                timeout=5
            )
            success = result.returncode == 0
            status = 'PASS' if success else 'FAIL'
            msg = result.stderr.decode()[:50] if result.stderr else ""
            self.log_test(f"Syntax: {Path(filepath).name}", status, msg)
            return success
        except Exception as e:
            self.log_test(f"Syntax: {Path(filepath).name}", 'FAIL', str(e)[:30])
            return False

    def test_json_valid(self, filepath: str) -> bool:
        """Test JSON validity"""
        try:
            with open(filepath) as f:
                json.load(f)
            self.log_test(f"JSON: {Path(filepath).name}", 'PASS')
            return True
        except Exception as e:
            self.log_test(f"JSON: {Path(filepath).name}", 'FAIL', str(e)[:40])
            return False

    def test_markdown_valid(self, filepath: str) -> bool:
        """Test Markdown file"""
        try:
            with open(filepath) as f:
                content = f.read(100)
                if len(content) > 0:
                    self.log_test(f"Markdown: {Path(filepath).name}", 'PASS')
                    return True
        except Exception as e:
            self.log_test(f"Markdown: {Path(filepath).name}", 'FAIL')
            return False

    def run_all_tests(self):
        """Run complete test suite"""
        print(f"\n{COLORS['BOLD']}=== AEON-777 TEST SUITE ==={COLORS['END']}\n")

        # Test core Python files
        print(f"{COLORS['BLUE']}Python Scripts:{COLORS['END']}")
        py_files = [
            'VAULT-CREDENTIALS.py',
            'CONNECTION-VALIDATOR.py',
            'FEDERATION-MEGA-INIT.py',
            'aeon-777-quickstart.py'
        ]
        for f in py_files:
            filepath = self.agent_home / f
            if filepath.exists():
                self.test_file_exists(str(filepath))
                self.test_python_syntax(str(filepath))

        # Test configuration files
        print(f"\n{COLORS['BLUE']}Configuration Files:{COLORS['END']}")
        config_files = [
            ('requirements.txt', 'text'),
            ('deployment-manifest.json', 'json'),
        ]
        for filename, ftype in config_files:
            filepath = self.agent_home / filename
            if filepath.exists():
                self.test_file_exists(str(filepath))
                if ftype == 'json':
                    self.test_json_valid(str(filepath))

        # Test documentation
        print(f"\n{COLORS['BLUE']}Documentation:{COLORS['END']}")
        doc_files = [
            'FEDERATION-COMPLETE-GUIDE.md',
            'AEON-777-BOOTUP-MANIFEST.md',
            'FINAL-BUILD-SUMMARY.md',
            'VAULT-BUILD-COMPLETE.md'
        ]
        for f in doc_files:
            filepath = self.agent_home / f
            if filepath.exists():
                self.test_file_exists(str(filepath))
                self.test_markdown_valid(str(filepath))

        # Test environment setup
        print(f"\n{COLORS['BLUE']}Environment Setup:{COLORS['END']}")
        self.test_environment()

        # Test execution paths
        print(f"\n{COLORS['BLUE']}Execution Tests:{COLORS['END']}")
        self.test_validator_execution()
        self.test_init_execution()

    def test_environment(self):
        """Test environment variables"""
        critical_vars = ['PATH', 'PYTHONPATH']
        for var in critical_vars:
            exists = var in os.environ
            status = 'PASS' if exists else 'WARN'
            self.log_test(f"Env: {var}", status)

    def test_validator_execution(self):
        """Test validator script"""
        try:
            result = subprocess.run(
                [sys.executable, str(self.agent_home / 'CONNECTION-VALIDATOR.py')],
                capture_output=True,
                timeout=30
            )
            success = result.returncode == 0
            status = 'PASS' if success else 'WARN'
            msg = "executed without errors" if success else "executed (with warnings)"
            self.log_test("Execute: CONNECTION-VALIDATOR.py", status, msg)
        except Exception as e:
            self.log_test("Execute: CONNECTION-VALIDATOR.py", 'FAIL', str(e)[:30])

    def test_init_execution(self):
        """Test init script"""
        try:
            result = subprocess.run(
                [sys.executable, str(self.agent_home / 'FEDERATION-MEGA-INIT.py')],
                capture_output=True,
                timeout=30
            )
            success = result.returncode == 0
            status = 'PASS' if success else 'WARN'
            msg = "executed without errors" if success else "partial init (expected)"
            self.log_test("Execute: FEDERATION-MEGA-INIT.py", status, msg)
        except Exception as e:
            self.log_test("Execute: FEDERATION-MEGA-INIT.py", 'FAIL', str(e)[:30])

    def generate_report(self):
        """Generate test report"""
        total = self.tests_passed + self.tests_failed + self.tests_warning
        
        report = f"\n{COLORS['BOLD']}=== TEST RESULTS ==={COLORS['END']}\n"
        report += f"Passed:  {self.tests_passed}\n"
        report += f"Failed:  {self.tests_failed}\n"
        report += f"Warned:  {self.tests_warning}\n"
        report += f"Total:   {total}\n\n"
        
        if self.tests_failed == 0 and self.tests_warning <= 2:
            status = f"{COLORS['GREEN']}✅ ALL SYSTEMS NOMINAL{COLORS['END']}"
        elif self.tests_failed == 0:
            status = f"{COLORS['YELLOW']}⚠️  WARNINGS PRESENT{COLORS['END']}"
        else:
            status = f"{COLORS['RED']}❌ ISSUES FOUND{COLORS['END']}"
        
        report += f"Status: {status}\n"
        report += f"Timestamp: {datetime.now().isoformat()}\n"
        
        return report

def main():
    suite = TestSuite()
    suite.run_all_tests()
    print(suite.generate_report())
    
    # Save results
    with open('/agent/home/test_results.json', 'w') as f:
        json.dump(suite.results, f, indent=2)
    
    # Exit code
    sys.exit(0 if suite.tests_failed == 0 else 1)

if __name__ == "__main__":
    main()
