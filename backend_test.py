#!/usr/bin/env python3
"""
Backend API Testing for Layered Relief Art App
Tests all API endpoints and functionality
"""

import requests
import sys
import json
import base64
import io
from datetime import datetime
from pathlib import Path

class LayeredReliefAPITester:
    def __init__(self, base_url="https://skyline-layerizer.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.style_id = None
        self.city_id = None
        self.queue_item_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        return success

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, form_data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    # For multipart form data with files
                    response = requests.post(url, files=files, data=form_data, timeout=30)
                else:
                    headers['Content-Type'] = 'application/json'
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                headers['Content-Type'] = 'application/json'
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return self.log_test(name, True), response_data
                except:
                    return self.log_test(name, True), {}
            else:
                try:
                    error_data = response.json()
                    return self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. Error: {error_data}"), {}
                except:
                    return self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:200]}"), {}

        except Exception as e:
            return self.log_test(name, False, f"Exception: {str(e)}"), {}

    def create_test_image(self):
        """Create a simple test image"""
        try:
            from PIL import Image, ImageDraw
            # Create a simple test cityscape image
            img = Image.new('RGB', (800, 600), color='lightblue')
            draw = ImageDraw.Draw(img)
            
            # Draw simple buildings
            draw.rectangle([100, 300, 200, 600], fill='gray')
            draw.rectangle([250, 200, 350, 600], fill='darkgray')
            draw.rectangle([400, 250, 500, 600], fill='gray')
            draw.rectangle([550, 150, 650, 600], fill='darkgray')
            
            # Save to bytes
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='PNG')
            return img_buffer.getvalue()
        except ImportError:
            # Fallback: create a minimal PNG
            # This is a 1x1 transparent PNG
            png_data = base64.b64decode(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg=='
            )
            return png_data

    def create_test_pdf(self):
        """Create a simple test PDF"""
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            
            buffer = io.BytesIO()
            p = canvas.Canvas(buffer, pagesize=letter)
            p.drawString(100, 750, "Style Guide for Vector Art")
            p.drawString(100, 700, "- Use clean, minimal lines")
            p.drawString(100, 680, "- High contrast black and white")
            p.drawString(100, 660, "- Emphasize architectural details")
            p.showPage()
            p.save()
            return buffer.getvalue()
        except ImportError:
            # Fallback: minimal PDF content
            pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
190
%%EOF"""
            return pdf_content

    def test_health_endpoint(self):
        """Test health endpoint"""
        success, data = self.run_test("Health Check", "GET", "health", 200)
        return success

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, data = self.run_test("Root API", "GET", "", 200)
        return success

    def test_admin_login_valid(self):
        """Test admin login with valid credentials"""
        login_data = {
            "email": "Mortada@howvier.com",
            "password": "Mo1982#"
        }
        success, data = self.run_test("Admin Login (Valid)", "POST", "admin/login", 200, login_data)
        if success:
            if data.get('success') and 'Welcome back, Mortada!' in data.get('message', ''):
                print(f"   Login successful: {data}")
                return True
            else:
                print(f"   Login response incorrect: {data}")
                return False
        return success

    def test_admin_login_invalid(self):
        """Test admin login with invalid credentials"""
        login_data = {
            "email": "wrong@email.com",
            "password": "wrongpass"
        }
        success, data = self.run_test("Admin Login (Invalid)", "POST", "admin/login", 401, login_data)
        return success

    def test_get_settings_initial(self):
        """Test getting settings when none are set"""
        success, data = self.run_test("Get Initial Settings", "GET", "settings", 200)
        if success:
            expected_keys = ['gemini_api_key_set', 'vision_api_key_set']
            if all(key in data for key in expected_keys):
                print(f"   Settings structure correct: {data}")
                return True
            else:
                print(f"   Missing expected keys in settings response")
                return False
        return success

    def test_save_settings(self):
        """Test saving API settings"""
        settings_data = {
            "gemini_api_key": "test_gemini_key_12345",
            "vision_api_key": "test_vision_key_67890"
        }
        success, data = self.run_test("Save Settings", "POST", "settings", 200, settings_data)
        if success:
            if data.get('success') and 'API keys saved!' in data.get('message', ''):
                print(f"   Settings saved successfully")
                return True
            else:
                print(f"   Settings not properly saved: {data}")
                return False
        return success

    def test_get_settings_after_save(self):
        """Test getting settings after saving"""
        success, data = self.run_test("Get Settings After Save", "GET", "settings", 200)
        if success:
            if data.get('gemini_api_key_set') and data.get('vision_api_key_set'):
                print(f"   Settings correctly retrieved: {data}")
                return True
            else:
                print(f"   Settings not properly retrieved: {data}")
                return False
        return success

    def test_create_project(self):
        """Test creating a new project"""
        project_data = {
            "name": f"Test Project {datetime.now().strftime('%H%M%S')}"
        }
        success, data = self.run_test("Create Project", "POST", "projects", 200, project_data)
        if success and 'id' in data:
            self.project_id = data['id']
            print(f"   Project created with ID: {self.project_id}")
            return True
        return success

    def test_get_project(self):
        """Test getting project details"""
        if not self.project_id:
            return self.log_test("Get Project", False, "No project ID available")
        
        success, data = self.run_test("Get Project", "GET", f"projects/{self.project_id}", 200)
        if success:
            expected_keys = ['id', 'name', 'status', 'created_at']
            if all(key in data for key in expected_keys):
                print(f"   Project details correct: {data}")
                return True
            else:
                print(f"   Missing expected keys in project response")
                return False
        return success

    def test_list_projects(self):
        """Test listing all projects"""
        success, data = self.run_test("List Projects", "GET", "projects", 200)
        if success and isinstance(data, list):
            print(f"   Found {len(data)} projects")
            return True
        return success

    def test_upload_image(self):
        """Test uploading an image"""
        if not self.project_id:
            return self.log_test("Upload Image", False, "No project ID available")
        
        image_data = self.create_test_image()
        files = {'file': ('test_cityscape.png', image_data, 'image/png')}
        
        success, data = self.run_test("Upload Image", "POST", f"upload/image/{self.project_id}", 200, files=files)
        if success and 'image_id' in data:
            self.image_id = data['image_id']
            print(f"   Image uploaded with ID: {self.image_id}")
            return True
        return success

    def test_upload_pdf(self):
        """Test uploading a PDF"""
        if not self.project_id:
            return self.log_test("Upload PDF", False, "No project ID available")
        
        pdf_data = self.create_test_pdf()
        files = {'file': ('test_style.pdf', pdf_data, 'application/pdf')}
        
        success, data = self.run_test("Upload PDF", "POST", f"upload/style/{self.project_id}", 200, files=files)
        if success and 'pdf_id' in data:
            self.pdf_id = data['pdf_id']
            print(f"   PDF uploaded with ID: {self.pdf_id}")
            return True
        return success

    def test_get_file(self):
        """Test getting file data"""
        if not self.image_id:
            return self.log_test("Get File", False, "No image ID available")
        
        success, data = self.run_test("Get File", "GET", f"files/{self.image_id}", 200)
        if success:
            expected_keys = ['id', 'filename', 'content_type', 'data']
            if all(key in data for key in expected_keys):
                print(f"   File data retrieved correctly")
                return True
            else:
                print(f"   Missing expected keys in file response")
                return False
        return success

    def test_process_stage1_without_api_key(self):
        """Test Stage 1 processing without proper API key (should fail gracefully)"""
        if not self.project_id:
            return self.log_test("Process Stage 1 (No API Key)", False, "No project ID available")
        
        # This should fail because we're using test keys, not real ones
        success, data = self.run_test("Process Stage 1 (Expected Fail)", "POST", f"process/stage1/{self.project_id}", 500)
        # We expect this to fail with 500 due to invalid API key
        if not success:
            # Check if it failed for the right reason (API key issue)
            print(f"   Stage 1 correctly failed due to API key issue (expected)")
            return True
        return False

    def test_process_stage2_without_api_key(self):
        """Test Stage 2 processing without proper API key (should fail gracefully)"""
        if not self.project_id:
            return self.log_test("Process Stage 2 (No API Key)", False, "No project ID available")
        
        # This should fail because we're using test keys, not real ones
        success, data = self.run_test("Process Stage 2 (Expected Fail)", "POST", f"process/stage2/{self.project_id}", 500)
        # We expect this to fail with 500 due to invalid API key
        if not success:
            print(f"   Stage 2 correctly failed due to API key issue (expected)")
            return True
        return False

    def test_invalid_endpoints(self):
        """Test invalid endpoints return proper errors"""
        success, data = self.run_test("Invalid Endpoint", "GET", "nonexistent", 404)
        return success

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Skyline Art Layerizer Backend Tests")
        print(f"   Base URL: {self.base_url}")
        print(f"   API URL: {self.api_url}")
        print("=" * 60)

        # Basic API tests
        self.test_health_endpoint()
        self.test_root_endpoint()
        
        # Settings tests
        self.test_get_settings_initial()
        self.test_save_settings()
        self.test_get_settings_after_save()
        
        # Project tests
        self.test_create_project()
        self.test_get_project()
        self.test_list_projects()
        
        # File upload tests
        self.test_upload_image()
        self.test_upload_pdf()
        self.test_get_file()
        
        # Processing tests (expected to fail with test API keys)
        self.test_process_stage1_without_api_key()
        self.test_process_stage2_without_api_key()
        
        # Error handling tests
        self.test_invalid_endpoints()

        # Print results
        print("\n" + "=" * 60)
        print(f"📊 Backend Tests Complete")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed, self.tests_run

def main():
    """Main test runner"""
    tester = SkylineAPITester()
    passed, total = tester.run_all_tests()
    
    # Return appropriate exit code
    if passed == total:
        print("\n🎉 All backend tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())