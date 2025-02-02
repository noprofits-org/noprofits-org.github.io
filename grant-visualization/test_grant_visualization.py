import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import requests
import json
import time
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
import sys
import socket
import tempfile
import shutil

def find_free_port():
    """Find a free port on localhost"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        s.listen(1)
        port = s.getsockname()[1]
    return port

class TestServer(threading.Thread):
    def __init__(self, port=None):
        super().__init__(daemon=True)
        self.port = port if port is not None else find_free_port()
        self.server = None
        self._started = threading.Event()

    def run(self):
        try:
            handler = SimpleHTTPRequestHandler
            self.server = HTTPServer(('localhost', self.port), handler)
            self._started.set()
            print(f"\nTest server started at http://localhost:{self.port}")
            self.server.serve_forever()
        except Exception as e:
            print(f"Server error: {e}")
            self._started.set()  # Set event even on failure
            raise

    def wait_for_start(self, timeout=5):
        """Wait for server to start"""
        if not self._started.wait(timeout):
            raise TimeoutError("Server failed to start within timeout")
        if not self.is_running():
            raise RuntimeError("Server failed to start properly")

    def stop(self):
        if self.server:
            self.server.shutdown()
            self.server.server_close()

    def is_running(self):
        """Check if server is running"""
        try:
            requests.get(f"http://localhost:{self.port}")
            return True
        except:
            return False

class GrantVisualizationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Start local server with dynamic port
        cls.server = TestServer()
        cls.server.start()
        try:
            cls.server.wait_for_start()
        except Exception as e:
            print(f"Failed to start server: {e}")
            cls.tearDownClass()
            raise

        # Setup WebDriver (Chrome)
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')  # Run in headless mode
        
        # Set download preferences
        prefs = {
            "download.default_directory": tempfile.mkdtemp(),
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": True
        }
        options.add_experimental_option("prefs", prefs)
        
        cls.driver = webdriver.Chrome(options=options)
        cls.base_url = f"http://localhost:{cls.server.port}"
        print(f"Testing against URL: {cls.base_url}")

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, 'driver'):
            cls.driver.quit()
        if hasattr(cls, 'server'):
            cls.server.stop()

    def setUp(self):
        self.driver.get(self.base_url + "/grant-visualization.html")
        time.sleep(2)  # Wait for page to load

    def test_initial_page_load(self):
        """Test that the page loads with all essential elements"""
        # Check for controls panel
        controls = self.driver.find_element(By.ID, "controls")
        self.assertTrue(controls.is_displayed())

        # Check for organization filter input
        org_filter = self.driver.find_element(By.ID, "orgFilter")
        self.assertTrue(org_filter.is_displayed())

        # Check for SVG container
        svg = self.driver.find_element(By.ID, "network")
        self.assertTrue(svg.is_displayed())

    def test_organization_search(self):
        """Test the organization search functionality"""
        org_filter = self.driver.find_element(By.ID, "orgFilter")
        
        # Clear existing value
        org_filter.clear()
        time.sleep(0.5)  # Wait for any previous search to clear
        
        # Try searching with a known EIN pattern from the data
        test_search = "000"  # Using a pattern that's likely to match
        org_filter.send_keys(test_search)
        time.sleep(1)  # Wait for search to process
        
        try:
            # Wait for matching orgs dropdown to appear
            matching_orgs = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.ID, "matchingOrgs"))
            )
            
            # Verify the dropdown exists
            self.assertIsNotNone(matching_orgs, "Matching organizations dropdown not found")
            
            # If no results found, try an alternative search
            if not matching_orgs.is_displayed():
                org_filter.clear()
                time.sleep(0.5)
                org_filter.send_keys("foundation")
                time.sleep(1)
                
                # Check again for results
                matching_orgs = WebDriverWait(self.driver, 5).until(
                    EC.presence_of_element_located((By.ID, "matchingOrgs"))
                )
            
            self.assertTrue(matching_orgs.is_displayed(), 
                          "Matching organizations dropdown should be visible")
            
        except TimeoutException:
            self.fail("Organization search results did not appear")

    def test_year_filter_functionality(self):
        """Test the year filter checkboxes"""
        year_checkboxes = self.driver.find_elements(
            By.CSS_SELECTOR, "#yearCheckboxes input[type='checkbox']"
        )
        self.assertGreater(len(year_checkboxes), 0, "Year checkboxes should be present")

        # Test checking/unchecking years
        first_checkbox = year_checkboxes[0]
        initial_state = first_checkbox.is_selected()
        first_checkbox.click()
        self.assertNotEqual(initial_state, first_checkbox.is_selected())

    def test_minimum_amount_slider(self):
        """Test the minimum amount slider functionality"""
        slider = self.driver.find_element(By.ID, "minAmount")
        display = self.driver.find_element(By.ID, "minAmountDisplay")

        # Test initial value
        self.assertEqual(display.text, "$0")

        # Test sliding to different value
        self.driver.execute_script(
            "arguments[0].value = '50'; arguments[0].dispatchEvent(new Event('input'));",
            slider
        )
        time.sleep(1)  # Wait for update
        self.assertNotEqual(display.text, "$0")

    def test_depth_input_validation(self):
        """Test depth input validation"""
        depth_input = self.driver.find_element(By.ID, "depth")

        # Test valid input
        depth_input.clear()
        # Send backspace to ensure field is cleared
        depth_input.send_keys('\b' * len(depth_input.get_attribute("value")))
        depth_input.send_keys("3")
        time.sleep(0.5)  # Wait for input to settle
        self.assertEqual(depth_input.get_attribute("value"), "3")

    def test_export_visualization(self):
        """Test the export visualization functionality"""
        # First, enter an organization to generate a visualization
        org_filter = self.driver.find_element(By.ID, "orgFilter")
        org_filter.clear()
        org_filter.send_keys("foundation")
        
        # Wait for and select first matching organization
        try:
            matching_orgs = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.ID, "matchingOrgs"))
            )
            time.sleep(1)  # Wait for dropdown to populate
            options = matching_orgs.find_elements(By.TAG_NAME, "option")
            if options:
                options[0].click()
        except TimeoutException:
            self.fail("No matching organizations found")

        # Click update to generate visualization
        update_btn = self.driver.find_element(By.ID, "updateViewBtn")
        update_btn.click()
        time.sleep(2)  # Wait for visualization to generate

        # Find and click export button
        try:
            export_btn = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.ID, "exportBtn"))
            )
            self.assertTrue(export_btn.is_displayed(), "Export button should be visible")

            # Create a temporary directory to monitor downloads
            temp_dir = tempfile.mkdtemp()
            
            # Configure Chrome for downloads
            self.driver.execute_cdp_cmd('Page.setDownloadBehavior', {
                'behavior': 'allow',
                'downloadPath': temp_dir
            })

            # Click export button
            export_btn.click()
            time.sleep(3)  # Wait for download to complete

            # Check if file was downloaded
            downloaded_files = os.listdir(temp_dir)
            self.assertTrue(
                any(f.endswith('.svg') for f in downloaded_files),
                "An SVG file should have been downloaded"
            )

            # Verify SVG content
            svg_file = next(f for f in downloaded_files if f.endswith('.svg'))
            with open(os.path.join(temp_dir, svg_file), 'r') as f:
                content = f.read()
                self.assertIn('<svg', content, "File should contain SVG content")
                self.assertIn('<metadata', content, "File should contain metadata tag")
                self.assertIn('orgFilter', content, "File should contain filter metadata")
                self.assertIn('timestamp', content, "File should contain timestamp metadata")
                
                # Verify JSON structure in metadata
                import re
                metadata_match = re.search(r'<metadata[^>]*>(.*?)</metadata>', content)
                self.assertIsNotNone(metadata_match, "Should find metadata content")
                
                try:
                    metadata_content = json.loads(metadata_match.group(1))
                    self.assertIsInstance(metadata_content, dict, "Metadata should be valid JSON object")
                    self.assertIn('orgFilter', metadata_content, "Metadata should contain orgFilter")
                    self.assertIn('timestamp', metadata_content, "Metadata should contain timestamp")
                except json.JSONDecodeError:
                    self.fail("Metadata should contain valid JSON")

            # Cleanup
            shutil.rmtree(temp_dir)

        except TimeoutException:
            self.fail("Export button not found")
        except Exception as e:
            self.fail(f"Export test failed: {str(e)}")

def run_tests():
    unittest.main(argv=[''], verbosity=2, exit=False)

if __name__ == "__main__":
    run_tests()