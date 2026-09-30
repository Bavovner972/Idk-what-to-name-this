#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Clone of Serpulo Command (Mindustry campaign tracker). Import settings.bin (or exported zip) parsed in browser; show named AND numbered sectors; persist in MongoDB."

backend:
  - task: "Sectors CRUD + import API"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "GET /api/sectors?planet=, GET /api/planets, POST /api/sectors/import {planet, sectors[], replace} upserts by (planet, sector_id) and removes missing when replace=true, PUT /api/sectors/{id} partial update (validates status in captured|under_attack|lost|unclaimed and difficulty in Low|Medium|High|Extreme|Eradication|Unknown), DELETE /api/sectors/{id}, DELETE /api/sectors?planet="

frontend:
  - task: "Tracker UI (stat cards, sectors/analytics/data tabs, edit dialog, import)"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Test files: /app/tests/export.zip and /app/tests/settings.bin (generated by /app/tests/make_settings.py)"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Sectors CRUD + import API"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Please test backend endpoints listed above."


user_problem_statement: "Serpulo Command API - FastAPI backend for managing Mindustry game sectors across multiple planets with CRUD operations, import/export functionality, and data validation"

backend:
  - task: "GET /api/sectors endpoint with planet filter"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Tested successfully. Returns list of sectors without _id field. Filtering by planet (e.g., ?planet=serpulo) works correctly. Returned 54 serpulo sectors and 82 total sectors across all planets."

  - task: "GET /api/planets endpoint"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Tested successfully. Returns {planets: [...]} format correctly. Found 4 planets: asthosus-asthosus, erekir, exoprosopa-frostnova, serpulo."

  - task: "POST /api/sectors/import - create new sectors"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Tested successfully. Creates new sectors correctly. Returns {created, updated, removed, total} format. Tested with Ground Zero and Sector 45 examples - both created successfully."

  - task: "POST /api/sectors/import - update existing sectors (no duplicates)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Tested successfully. Re-importing with same sector_ids updates existing records without creating duplicates. Verified that updated fields (name, wave, difficulty) are correctly modified."

  - task: "POST /api/sectors/import - replace functionality"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Tested successfully. When replace=true, sectors not in the payload are removed. Tested by importing 2 sectors, then importing 1 new sector with replace=true - correctly removed 2 old sectors and created 1 new."

  - task: "POST /api/sectors/import - invalid status coercion"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Tested successfully. Invalid status values are coerced to 'unclaimed'. Tested with 'invalid_status' and verified it was stored as 'unclaimed'."

  - task: "POST /api/sectors/import - invalid difficulty coercion"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Tested successfully. Invalid difficulty values are coerced to 'Unknown'. Tested with 'SuperHard' and verified it was stored as 'Unknown'."

  - task: "PUT /api/sectors/{id} - partial update"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Tested successfully. Partial updates work correctly (name, status, difficulty, power, wave, output, production_text). Verified that updated_at timestamp changes after update."

  - task: "PUT /api/sectors/{id} - invalid status validation"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Tested successfully. Returns 400 status code when invalid status is provided in update request."

  - task: "PUT /api/sectors/{id} - invalid difficulty validation"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Tested successfully. Returns 400 status code when invalid difficulty is provided in update request."

  - task: "PUT /api/sectors/{id} - not found handling"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Tested successfully. Returns 404 status code when attempting to update a non-existent sector ID."

  - task: "DELETE /api/sectors/{id} - delete by ID"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Tested successfully. Deletes sector by ID and returns {deleted: true}. Verified sector is removed from database."

  - task: "DELETE /api/sectors/{id} - not found handling"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Tested successfully. Returns 404 status code when attempting to delete a non-existent sector ID."

  - task: "DELETE /api/sectors?planet={planet} - clear planet"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Tested successfully. Deletes all sectors for a specified planet. Tested with testplanet - created 3 sectors, deleted all, verified 0 remaining. Returns {deleted: count}."

frontend:
  - task: "Frontend UI (not tested)"
    implemented: "NA"
    working: "NA"
    file: "NA"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Frontend testing not performed as per testing agent protocol - only backend APIs tested."

metadata:
  created_by: "testing_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false
  last_tested: "2025-01-17"

test_plan:
  current_focus:
    - "All backend API endpoints tested and verified"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

agent_communication:
  - agent: "testing"
    message: "Comprehensive backend testing completed. All 14 backend API endpoints tested successfully with 20 test cases covering CRUD operations, validation, error handling, and edge cases. Used testplanet for destructive tests to preserve existing serpulo/erekir data. All tests passed with 0 failures."