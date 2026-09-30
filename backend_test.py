"""
Comprehensive Backend API Tests for Serpulo Command API
Tests all endpoints with various scenarios including edge cases
"""
import requests
import json
from typing import Dict, List, Any

# Backend URL from frontend/.env
BASE_URL = "https://pulse-flow-next.preview.emergentagent.com/api"
TEST_PLANET = "testplanet"

class TestResults:
    def __init__(self):
        self.passed = []
        self.failed = []
        self.warnings = []
    
    def add_pass(self, test_name: str, details: str = ""):
        self.passed.append(f"✅ {test_name}: {details}")
        print(f"✅ PASS: {test_name}")
        if details:
            print(f"   {details}")
    
    def add_fail(self, test_name: str, details: str):
        self.failed.append(f"❌ {test_name}: {details}")
        print(f"❌ FAIL: {test_name}")
        print(f"   {details}")
    
    def add_warning(self, test_name: str, details: str):
        self.warnings.append(f"⚠️  {test_name}: {details}")
        print(f"⚠️  WARNING: {test_name}")
        print(f"   {details}")
    
    def summary(self):
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        print(f"Passed: {len(self.passed)}")
        print(f"Failed: {len(self.failed)}")
        print(f"Warnings: {len(self.warnings)}")
        print("="*80)
        
        if self.failed:
            print("\n❌ FAILED TESTS:")
            for fail in self.failed:
                print(f"  {fail}")
        
        if self.warnings:
            print("\n⚠️  WARNINGS:")
            for warn in self.warnings:
                print(f"  {warn}")
        
        if self.passed:
            print("\n✅ PASSED TESTS:")
            for p in self.passed:
                print(f"  {p}")
        
        return len(self.failed) == 0

results = TestResults()

def test_api_root():
    """Test GET /api/ endpoint"""
    print("\n" + "="*80)
    print("TEST: API Root")
    print("="*80)
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                results.add_pass("API Root", f"Response: {data}")
            else:
                results.add_fail("API Root", f"Missing 'message' field in response: {data}")
        else:
            results.add_fail("API Root", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_fail("API Root", f"Exception: {str(e)}")

def test_get_planets():
    """Test GET /api/planets endpoint"""
    print("\n" + "="*80)
    print("TEST: GET /api/planets")
    print("="*80)
    try:
        response = requests.get(f"{BASE_URL}/planets")
        if response.status_code == 200:
            data = response.json()
            if "planets" in data and isinstance(data["planets"], list):
                results.add_pass("GET /api/planets", f"Found {len(data['planets'])} planets: {data['planets']}")
            else:
                results.add_fail("GET /api/planets", f"Invalid response format: {data}")
        else:
            results.add_fail("GET /api/planets", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_fail("GET /api/planets", f"Exception: {str(e)}")

def test_get_sectors_no_filter():
    """Test GET /api/sectors without planet filter"""
    print("\n" + "="*80)
    print("TEST: GET /api/sectors (no filter)")
    print("="*80)
    try:
        response = requests.get(f"{BASE_URL}/sectors")
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                # Check that _id is not present
                has_id = any("_id" in sector for sector in data)
                if has_id:
                    results.add_fail("GET /api/sectors (no _id check)", "Response contains _id field")
                else:
                    results.add_pass("GET /api/sectors (no filter)", f"Returned {len(data)} sectors without _id")
            else:
                results.add_fail("GET /api/sectors (no filter)", f"Response is not a list: {type(data)}")
        else:
            results.add_fail("GET /api/sectors (no filter)", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_fail("GET /api/sectors (no filter)", f"Exception: {str(e)}")

def test_get_sectors_with_planet():
    """Test GET /api/sectors?planet=serpulo"""
    print("\n" + "="*80)
    print("TEST: GET /api/sectors?planet=serpulo")
    print("="*80)
    try:
        response = requests.get(f"{BASE_URL}/sectors", params={"planet": "serpulo"})
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                # Check that _id is not present
                has_id = any("_id" in sector for sector in data)
                if has_id:
                    results.add_fail("GET /api/sectors?planet=serpulo (_id check)", "Response contains _id field")
                else:
                    # Check all sectors are for serpulo
                    wrong_planet = [s for s in data if s.get("planet") != "serpulo"]
                    if wrong_planet:
                        results.add_fail("GET /api/sectors?planet=serpulo", f"Found {len(wrong_planet)} sectors not from serpulo")
                    else:
                        results.add_pass("GET /api/sectors?planet=serpulo", f"Returned {len(data)} serpulo sectors without _id")
            else:
                results.add_fail("GET /api/sectors?planet=serpulo", f"Response is not a list: {type(data)}")
        else:
            results.add_fail("GET /api/sectors?planet=serpulo", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_fail("GET /api/sectors?planet=serpulo", f"Exception: {str(e)}")

def cleanup_test_planet():
    """Clean up test planet data"""
    try:
        response = requests.delete(f"{BASE_URL}/sectors", params={"planet": TEST_PLANET})
        if response.status_code == 200:
            data = response.json()
            print(f"   Cleaned up {data.get('deleted', 0)} test sectors")
    except Exception as e:
        print(f"   Warning: Cleanup failed: {str(e)}")

def test_import_sectors_create():
    """Test POST /api/sectors/import - creating new sectors"""
    print("\n" + "="*80)
    print("TEST: POST /api/sectors/import (create)")
    print("="*80)
    
    # Clean up first
    cleanup_test_planet()
    
    payload = {
        "planet": TEST_PLANET,
        "replace": True,
        "sectors": [
            {
                "sector_id": 15,
                "name": "Ground Zero",
                "preset": "groundZero",
                "numbered": False,
                "status": "captured",
                "difficulty": "Low",
                "wave": 12,
                "output": 450,
                "production": [{"item": "copper", "rate": 300}],
                "production_text": "copper 300.0/min",
                "order": 0
            },
            {
                "sector_id": 45,
                "name": "Sector 45",
                "numbered": True,
                "status": "under_attack",
                "difficulty": "Unknown",
                "wave": 3
            }
        ]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/sectors/import", json=payload)
        if response.status_code == 200:
            data = response.json()
            expected_keys = ["created", "updated", "removed", "total"]
            if all(k in data for k in expected_keys):
                if data["created"] == 2 and data["updated"] == 0 and data["total"] == 2:
                    results.add_pass("POST /api/sectors/import (create)", f"Created 2 sectors: {data}")
                else:
                    results.add_fail("POST /api/sectors/import (create)", f"Unexpected counts: {data}")
            else:
                results.add_fail("POST /api/sectors/import (create)", f"Missing keys in response: {data}")
        else:
            results.add_fail("POST /api/sectors/import (create)", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_fail("POST /api/sectors/import (create)", f"Exception: {str(e)}")

def test_import_sectors_update():
    """Test POST /api/sectors/import - updating existing sectors (no duplicates)"""
    print("\n" + "="*80)
    print("TEST: POST /api/sectors/import (update - no duplicates)")
    print("="*80)
    
    payload = {
        "planet": TEST_PLANET,
        "replace": True,
        "sectors": [
            {
                "sector_id": 15,
                "name": "Ground Zero Updated",
                "preset": "groundZero",
                "numbered": False,
                "status": "captured",
                "difficulty": "Medium",
                "wave": 20,
                "output": 600,
                "production": [{"item": "copper", "rate": 400}],
                "production_text": "copper 400.0/min",
                "order": 0
            },
            {
                "sector_id": 45,
                "name": "Sector 45 Updated",
                "numbered": True,
                "status": "lost",
                "difficulty": "High",
                "wave": 5
            }
        ]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/sectors/import", json=payload)
        if response.status_code == 200:
            data = response.json()
            if data["created"] == 0 and data["updated"] == 2 and data["total"] == 2:
                results.add_pass("POST /api/sectors/import (update)", f"Updated 2 sectors without duplicates: {data}")
                
                # Verify the updates
                sectors_response = requests.get(f"{BASE_URL}/sectors", params={"planet": TEST_PLANET})
                if sectors_response.status_code == 200:
                    sectors = sectors_response.json()
                    if len(sectors) == 2:
                        sector_15 = next((s for s in sectors if s["sector_id"] == 15), None)
                        if sector_15 and sector_15["name"] == "Ground Zero Updated" and sector_15["wave"] == 20:
                            results.add_pass("POST /api/sectors/import (verify update)", "Sector 15 updated correctly")
                        else:
                            results.add_fail("POST /api/sectors/import (verify update)", f"Sector 15 not updated correctly: {sector_15}")
                    else:
                        results.add_fail("POST /api/sectors/import (verify no duplicates)", f"Expected 2 sectors, found {len(sectors)}")
            else:
                results.add_fail("POST /api/sectors/import (update)", f"Unexpected counts: {data}")
        else:
            results.add_fail("POST /api/sectors/import (update)", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_fail("POST /api/sectors/import (update)", f"Exception: {str(e)}")

def test_import_sectors_replace():
    """Test POST /api/sectors/import - replace=true removes sectors not in payload"""
    print("\n" + "="*80)
    print("TEST: POST /api/sectors/import (replace removes old sectors)")
    print("="*80)
    
    payload = {
        "planet": TEST_PLANET,
        "replace": True,
        "sectors": [
            {
                "sector_id": 100,
                "name": "New Sector",
                "numbered": True,
                "status": "unclaimed",
                "difficulty": "Unknown",
                "wave": 0
            }
        ]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/sectors/import", json=payload)
        if response.status_code == 200:
            data = response.json()
            if data["removed"] == 2 and data["created"] == 1 and data["total"] == 1:
                results.add_pass("POST /api/sectors/import (replace)", f"Removed 2 old sectors, created 1 new: {data}")
                
                # Verify only the new sector exists
                sectors_response = requests.get(f"{BASE_URL}/sectors", params={"planet": TEST_PLANET})
                if sectors_response.status_code == 200:
                    sectors = sectors_response.json()
                    if len(sectors) == 1 and sectors[0]["sector_id"] == 100:
                        results.add_pass("POST /api/sectors/import (verify replace)", "Only new sector exists")
                    else:
                        results.add_fail("POST /api/sectors/import (verify replace)", f"Expected 1 sector with id 100, found: {sectors}")
            else:
                results.add_fail("POST /api/sectors/import (replace)", f"Unexpected counts: {data}")
        else:
            results.add_fail("POST /api/sectors/import (replace)", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_fail("POST /api/sectors/import (replace)", f"Exception: {str(e)}")

def test_import_sectors_invalid_status_coercion():
    """Test POST /api/sectors/import - invalid status gets coerced to unclaimed"""
    print("\n" + "="*80)
    print("TEST: POST /api/sectors/import (invalid status coercion)")
    print("="*80)
    
    cleanup_test_planet()
    
    payload = {
        "planet": TEST_PLANET,
        "replace": True,
        "sectors": [
            {
                "sector_id": 200,
                "name": "Invalid Status Sector",
                "numbered": True,
                "status": "invalid_status",
                "difficulty": "Low",
                "wave": 0
            }
        ]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/sectors/import", json=payload)
        if response.status_code == 200:
            # Verify the status was coerced
            sectors_response = requests.get(f"{BASE_URL}/sectors", params={"planet": TEST_PLANET})
            if sectors_response.status_code == 200:
                sectors = sectors_response.json()
                if len(sectors) == 1 and sectors[0]["status"] == "unclaimed":
                    results.add_pass("POST /api/sectors/import (invalid status)", "Invalid status coerced to 'unclaimed'")
                else:
                    results.add_fail("POST /api/sectors/import (invalid status)", f"Status not coerced correctly: {sectors}")
            else:
                results.add_fail("POST /api/sectors/import (invalid status)", f"Failed to fetch sectors: {sectors_response.status_code}")
        else:
            results.add_fail("POST /api/sectors/import (invalid status)", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_fail("POST /api/sectors/import (invalid status)", f"Exception: {str(e)}")

def test_import_sectors_invalid_difficulty_coercion():
    """Test POST /api/sectors/import - invalid difficulty gets coerced to Unknown"""
    print("\n" + "="*80)
    print("TEST: POST /api/sectors/import (invalid difficulty coercion)")
    print("="*80)
    
    cleanup_test_planet()
    
    payload = {
        "planet": TEST_PLANET,
        "replace": True,
        "sectors": [
            {
                "sector_id": 201,
                "name": "Invalid Difficulty Sector",
                "numbered": True,
                "status": "captured",
                "difficulty": "SuperHard",
                "wave": 0
            }
        ]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/sectors/import", json=payload)
        if response.status_code == 200:
            # Verify the difficulty was coerced
            sectors_response = requests.get(f"{BASE_URL}/sectors", params={"planet": TEST_PLANET})
            if sectors_response.status_code == 200:
                sectors = sectors_response.json()
                if len(sectors) == 1 and sectors[0]["difficulty"] == "Unknown":
                    results.add_pass("POST /api/sectors/import (invalid difficulty)", "Invalid difficulty coerced to 'Unknown'")
                else:
                    results.add_fail("POST /api/sectors/import (invalid difficulty)", f"Difficulty not coerced correctly: {sectors}")
            else:
                results.add_fail("POST /api/sectors/import (invalid difficulty)", f"Failed to fetch sectors: {sectors_response.status_code}")
        else:
            results.add_fail("POST /api/sectors/import (invalid difficulty)", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_fail("POST /api/sectors/import (invalid difficulty)", f"Exception: {str(e)}")

def test_put_sector_partial_update():
    """Test PUT /api/sectors/{id} - partial update"""
    print("\n" + "="*80)
    print("TEST: PUT /api/sectors/{id} (partial update)")
    print("="*80)
    
    # First, get a sector to update
    try:
        sectors_response = requests.get(f"{BASE_URL}/sectors", params={"planet": TEST_PLANET})
        if sectors_response.status_code != 200:
            results.add_fail("PUT /api/sectors/{id} (setup)", "Failed to get test sectors")
            return
        
        sectors = sectors_response.json()
        if not sectors:
            results.add_fail("PUT /api/sectors/{id} (setup)", "No test sectors available")
            return
        
        sector = sectors[0]
        sector_id = sector["id"]
        original_updated_at = sector["updated_at"]
        
        # Update some fields
        update_payload = {
            "name": "Updated Name",
            "wave": 99,
            "output": 1000
        }
        
        response = requests.put(f"{BASE_URL}/sectors/{sector_id}", json=update_payload)
        if response.status_code == 200:
            updated_sector = response.json()
            if (updated_sector["name"] == "Updated Name" and 
                updated_sector["wave"] == 99 and 
                updated_sector["output"] == 1000 and
                updated_sector["updated_at"] != original_updated_at):
                results.add_pass("PUT /api/sectors/{id} (partial update)", "Fields updated correctly and updated_at changed")
            else:
                results.add_fail("PUT /api/sectors/{id} (partial update)", f"Update failed: {updated_sector}")
        else:
            results.add_fail("PUT /api/sectors/{id} (partial update)", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_fail("PUT /api/sectors/{id} (partial update)", f"Exception: {str(e)}")

def test_put_sector_invalid_status():
    """Test PUT /api/sectors/{id} - invalid status returns 400"""
    print("\n" + "="*80)
    print("TEST: PUT /api/sectors/{id} (invalid status -> 400)")
    print("="*80)
    
    try:
        sectors_response = requests.get(f"{BASE_URL}/sectors", params={"planet": TEST_PLANET})
        if sectors_response.status_code != 200:
            results.add_fail("PUT /api/sectors/{id} (invalid status setup)", "Failed to get test sectors")
            return
        
        sectors = sectors_response.json()
        if not sectors:
            results.add_fail("PUT /api/sectors/{id} (invalid status setup)", "No test sectors available")
            return
        
        sector_id = sectors[0]["id"]
        
        update_payload = {
            "status": "invalid_status_value"
        }
        
        response = requests.put(f"{BASE_URL}/sectors/{sector_id}", json=update_payload)
        if response.status_code == 400:
            results.add_pass("PUT /api/sectors/{id} (invalid status)", "Correctly returned 400 for invalid status")
        else:
            results.add_fail("PUT /api/sectors/{id} (invalid status)", f"Expected 400, got {response.status_code}: {response.text}")
    except Exception as e:
        results.add_fail("PUT /api/sectors/{id} (invalid status)", f"Exception: {str(e)}")

def test_put_sector_invalid_difficulty():
    """Test PUT /api/sectors/{id} - invalid difficulty returns 400"""
    print("\n" + "="*80)
    print("TEST: PUT /api/sectors/{id} (invalid difficulty -> 400)")
    print("="*80)
    
    try:
        sectors_response = requests.get(f"{BASE_URL}/sectors", params={"planet": TEST_PLANET})
        if sectors_response.status_code != 200:
            results.add_fail("PUT /api/sectors/{id} (invalid difficulty setup)", "Failed to get test sectors")
            return
        
        sectors = sectors_response.json()
        if not sectors:
            results.add_fail("PUT /api/sectors/{id} (invalid difficulty setup)", "No test sectors available")
            return
        
        sector_id = sectors[0]["id"]
        
        update_payload = {
            "difficulty": "SuperDuperHard"
        }
        
        response = requests.put(f"{BASE_URL}/sectors/{sector_id}", json=update_payload)
        if response.status_code == 400:
            results.add_pass("PUT /api/sectors/{id} (invalid difficulty)", "Correctly returned 400 for invalid difficulty")
        else:
            results.add_fail("PUT /api/sectors/{id} (invalid difficulty)", f"Expected 400, got {response.status_code}: {response.text}")
    except Exception as e:
        results.add_fail("PUT /api/sectors/{id} (invalid difficulty)", f"Exception: {str(e)}")

def test_put_sector_not_found():
    """Test PUT /api/sectors/{id} - unknown id returns 404"""
    print("\n" + "="*80)
    print("TEST: PUT /api/sectors/{id} (unknown id -> 404)")
    print("="*80)
    
    fake_id = "00000000-0000-0000-0000-000000000000"
    update_payload = {
        "name": "Should Not Work"
    }
    
    try:
        response = requests.put(f"{BASE_URL}/sectors/{fake_id}", json=update_payload)
        if response.status_code == 404:
            results.add_pass("PUT /api/sectors/{id} (not found)", "Correctly returned 404 for unknown id")
        else:
            results.add_fail("PUT /api/sectors/{id} (not found)", f"Expected 404, got {response.status_code}: {response.text}")
    except Exception as e:
        results.add_fail("PUT /api/sectors/{id} (not found)", f"Exception: {str(e)}")

def test_delete_sector_by_id():
    """Test DELETE /api/sectors/{id}"""
    print("\n" + "="*80)
    print("TEST: DELETE /api/sectors/{id}")
    print("="*80)
    
    try:
        sectors_response = requests.get(f"{BASE_URL}/sectors", params={"planet": TEST_PLANET})
        if sectors_response.status_code != 200:
            results.add_fail("DELETE /api/sectors/{id} (setup)", "Failed to get test sectors")
            return
        
        sectors = sectors_response.json()
        if not sectors:
            results.add_fail("DELETE /api/sectors/{id} (setup)", "No test sectors available")
            return
        
        sector_id = sectors[0]["id"]
        
        response = requests.delete(f"{BASE_URL}/sectors/{sector_id}")
        if response.status_code == 200:
            data = response.json()
            if data.get("deleted") == True:
                results.add_pass("DELETE /api/sectors/{id}", f"Successfully deleted sector {sector_id}")
                
                # Verify it's gone
                verify_response = requests.get(f"{BASE_URL}/sectors", params={"planet": TEST_PLANET})
                if verify_response.status_code == 200:
                    remaining = verify_response.json()
                    if not any(s["id"] == sector_id for s in remaining):
                        results.add_pass("DELETE /api/sectors/{id} (verify)", "Sector successfully removed")
                    else:
                        results.add_fail("DELETE /api/sectors/{id} (verify)", "Sector still exists after deletion")
            else:
                results.add_fail("DELETE /api/sectors/{id}", f"Unexpected response: {data}")
        else:
            results.add_fail("DELETE /api/sectors/{id}", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_fail("DELETE /api/sectors/{id}", f"Exception: {str(e)}")

def test_delete_sector_not_found():
    """Test DELETE /api/sectors/{id} - unknown id returns 404"""
    print("\n" + "="*80)
    print("TEST: DELETE /api/sectors/{id} (unknown id -> 404)")
    print("="*80)
    
    fake_id = "00000000-0000-0000-0000-000000000000"
    
    try:
        response = requests.delete(f"{BASE_URL}/sectors/{fake_id}")
        if response.status_code == 404:
            results.add_pass("DELETE /api/sectors/{id} (not found)", "Correctly returned 404 for unknown id")
        else:
            results.add_fail("DELETE /api/sectors/{id} (not found)", f"Expected 404, got {response.status_code}: {response.text}")
    except Exception as e:
        results.add_fail("DELETE /api/sectors/{id} (not found)", f"Exception: {str(e)}")

def test_delete_sectors_by_planet():
    """Test DELETE /api/sectors?planet=testplanet"""
    print("\n" + "="*80)
    print("TEST: DELETE /api/sectors?planet=testplanet")
    print("="*80)
    
    # First create some test data
    payload = {
        "planet": TEST_PLANET,
        "replace": True,
        "sectors": [
            {"sector_id": 1, "name": "Test 1", "numbered": True, "status": "captured", "difficulty": "Low", "wave": 0},
            {"sector_id": 2, "name": "Test 2", "numbered": True, "status": "captured", "difficulty": "Low", "wave": 0},
            {"sector_id": 3, "name": "Test 3", "numbered": True, "status": "captured", "difficulty": "Low", "wave": 0}
        ]
    }
    
    try:
        import_response = requests.post(f"{BASE_URL}/sectors/import", json=payload)
        if import_response.status_code != 200:
            results.add_fail("DELETE /api/sectors?planet (setup)", "Failed to create test data")
            return
        
        # Now delete all sectors for the test planet
        response = requests.delete(f"{BASE_URL}/sectors", params={"planet": TEST_PLANET})
        if response.status_code == 200:
            data = response.json()
            if data.get("deleted") == 3:
                results.add_pass("DELETE /api/sectors?planet", f"Successfully deleted 3 sectors for {TEST_PLANET}")
                
                # Verify they're gone
                verify_response = requests.get(f"{BASE_URL}/sectors", params={"planet": TEST_PLANET})
                if verify_response.status_code == 200:
                    remaining = verify_response.json()
                    if len(remaining) == 0:
                        results.add_pass("DELETE /api/sectors?planet (verify)", "All sectors removed")
                    else:
                        results.add_fail("DELETE /api/sectors?planet (verify)", f"Still {len(remaining)} sectors remaining")
            else:
                results.add_fail("DELETE /api/sectors?planet", f"Expected 3 deleted, got: {data}")
        else:
            results.add_fail("DELETE /api/sectors?planet", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_fail("DELETE /api/sectors?planet", f"Exception: {str(e)}")

def test_new_fields_import_and_get():
    """Test POST /api/sectors/import with new fields (exports, export_total, export_text, has_save, items, storage_capacity)"""
    print("\n" + "="*80)
    print("TEST: New Fields - Import and GET")
    print("="*80)
    
    # Clean up first
    cleanup_test_planet()
    
    payload = {
        "planet": TEST_PLANET,
        "replace": True,
        "sectors": [
            {
                "sector_id": 500,
                "name": "Silicon Export Base",
                "numbered": True,
                "status": "captured",
                "difficulty": "Medium",
                "wave": 15,
                "exports": [{"item": "silicon", "rate": 600}],
                "export_total": 600,
                "export_text": "silicon 600.0/min",
                "has_save": True,
                "items": {"copper": 4000},
                "storage_capacity": 9000
            },
            {
                "sector_id": 501,
                "name": "Sector Without New Fields",
                "numbered": True,
                "status": "captured",
                "difficulty": "Low",
                "wave": 5
            }
        ]
    }
    
    try:
        # Import sectors
        response = requests.post(f"{BASE_URL}/sectors/import", json=payload)
        if response.status_code != 200:
            results.add_fail("New Fields - Import", f"Import failed with status {response.status_code}: {response.text}")
            return
        
        # Get sectors back
        sectors_response = requests.get(f"{BASE_URL}/sectors", params={"planet": TEST_PLANET})
        if sectors_response.status_code != 200:
            results.add_fail("New Fields - GET", f"GET failed with status {sectors_response.status_code}")
            return
        
        sectors = sectors_response.json()
        
        # Find sector 500 (with new fields)
        sector_500 = next((s for s in sectors if s["sector_id"] == 500), None)
        if not sector_500:
            results.add_fail("New Fields - Sector 500", "Sector 500 not found")
            return
        
        # Verify all new fields are intact
        errors = []
        if sector_500.get("exports") != [{"item": "silicon", "rate": 600}]:
            errors.append(f"exports mismatch: {sector_500.get('exports')}")
        if sector_500.get("export_total") != 600:
            errors.append(f"export_total mismatch: {sector_500.get('export_total')}")
        if sector_500.get("export_text") != "silicon 600.0/min":
            errors.append(f"export_text mismatch: {sector_500.get('export_text')}")
        if sector_500.get("has_save") != True:
            errors.append(f"has_save mismatch: {sector_500.get('has_save')}")
        if sector_500.get("items") != {"copper": 4000}:
            errors.append(f"items mismatch: {sector_500.get('items')}")
        if sector_500.get("storage_capacity") != 9000:
            errors.append(f"storage_capacity mismatch: {sector_500.get('storage_capacity')}")
        
        if errors:
            results.add_fail("New Fields - Sector 500 Verification", "; ".join(errors))
        else:
            results.add_pass("New Fields - Sector 500", "All new fields intact: exports, export_total, export_text, has_save, items, storage_capacity")
        
        # Find sector 501 (without new fields - should have defaults)
        sector_501 = next((s for s in sectors if s["sector_id"] == 501), None)
        if not sector_501:
            results.add_fail("New Fields - Sector 501", "Sector 501 not found")
            return
        
        # Verify defaults
        default_errors = []
        if sector_501.get("exports") != []:
            default_errors.append(f"exports default mismatch: {sector_501.get('exports')}")
        if sector_501.get("export_total") != 0:
            default_errors.append(f"export_total default mismatch: {sector_501.get('export_total')}")
        if sector_501.get("export_text") != "":
            default_errors.append(f"export_text default mismatch: {sector_501.get('export_text')}")
        if sector_501.get("has_save") is not None:
            default_errors.append(f"has_save default mismatch: {sector_501.get('has_save')}")
        if sector_501.get("items") != {}:
            default_errors.append(f"items default mismatch: {sector_501.get('items')}")
        if sector_501.get("storage_capacity") != 0:
            default_errors.append(f"storage_capacity default mismatch: {sector_501.get('storage_capacity')}")
        
        if default_errors:
            results.add_fail("New Fields - Sector 501 Defaults", "; ".join(default_errors))
        else:
            results.add_pass("New Fields - Sector 501 Defaults", "All defaults correct: exports=[], export_total=0, export_text='', has_save=null, items={}, storage_capacity=0")
    
    except Exception as e:
        results.add_fail("New Fields - Import and GET", f"Exception: {str(e)}")

def test_new_fields_update():
    """Test PUT /api/sectors/{id} with export_text and export_total"""
    print("\n" + "="*80)
    print("TEST: New Fields - PUT Update")
    print("="*80)
    
    try:
        # Get sector 500 to update
        sectors_response = requests.get(f"{BASE_URL}/sectors", params={"planet": TEST_PLANET})
        if sectors_response.status_code != 200:
            results.add_fail("New Fields - PUT Setup", "Failed to get test sectors")
            return
        
        sectors = sectors_response.json()
        sector_500 = next((s for s in sectors if s["sector_id"] == 500), None)
        if not sector_500:
            results.add_fail("New Fields - PUT Setup", "Sector 500 not found")
            return
        
        sector_id = sector_500["id"]
        
        # Update export_text and export_total
        update_payload = {
            "export_text": "copper 10.0/min",
            "export_total": 10
        }
        
        response = requests.put(f"{BASE_URL}/sectors/{sector_id}", json=update_payload)
        if response.status_code != 200:
            results.add_fail("New Fields - PUT Update", f"PUT failed with status {response.status_code}: {response.text}")
            return
        
        updated_sector = response.json()
        
        # Verify updates
        if updated_sector.get("export_text") == "copper 10.0/min" and updated_sector.get("export_total") == 10:
            results.add_pass("New Fields - PUT Update", "export_text and export_total updated successfully")
        else:
            results.add_fail("New Fields - PUT Update", f"Update failed: export_text={updated_sector.get('export_text')}, export_total={updated_sector.get('export_total')}")
    
    except Exception as e:
        results.add_fail("New Fields - PUT Update", f"Exception: {str(e)}")

def main():
    print("="*80)
    print("SERPULO COMMAND API - COMPREHENSIVE BACKEND TESTS")
    print(f"Testing against: {BASE_URL}")
    print("="*80)
    
    # Run all tests in order
    test_api_root()
    test_get_planets()
    test_get_sectors_no_filter()
    test_get_sectors_with_planet()
    test_import_sectors_create()
    test_import_sectors_update()
    test_import_sectors_replace()
    test_import_sectors_invalid_status_coercion()
    test_import_sectors_invalid_difficulty_coercion()
    test_put_sector_partial_update()
    test_put_sector_invalid_status()
    test_put_sector_invalid_difficulty()
    test_put_sector_not_found()
    test_delete_sector_by_id()
    test_delete_sector_not_found()
    test_delete_sectors_by_planet()
    
    # New fields tests
    test_new_fields_import_and_get()
    test_new_fields_update()
    
    # Final cleanup
    print("\n" + "="*80)
    print("CLEANUP")
    print("="*80)
    cleanup_test_planet()
    
    # Print summary
    success = results.summary()
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
