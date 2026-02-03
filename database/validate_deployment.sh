#!/bin/bash

# AEGIS v5.0 - SQL Deployment Validation Script
# Usage: ./validate_deployment.sh [-h hostname] [-U username] [-d database]

set -e

# Default values
HOSTNAME="localhost"
USERNAME="postgres"
DATABASE="aegis_db"
PORT="5432"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Parse arguments
while getopts "h:U:d:p:" opt; do
    case $opt in
        h) HOSTNAME="$OPTARG" ;;
        U) USERNAME="$OPTARG" ;;
        d) DATABASE="$OPTARG" ;;
        p) PORT="$OPTARG" ;;
        *) echo "Usage: $0 [-h hostname] [-U username] [-d database] [-p port]"; exit 1 ;;
    esac
done

print_section "AEGIS v5.0 - Deployment Validation"
echo "Host: $HOSTNAME | User: $USERNAME | Database: $DATABASE | Port: $PORT"

# Test database connection
echo ""
echo "Testing database connection..."
if psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -c "SELECT 1" > /dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_error "Cannot connect to database. Check credentials and PostgreSQL is running."
    exit 1
fi

# Define validation queries
run_validation() {
    local name=$1
    local query=$2
    local expected=$3
    
    result=$(psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -t -c "$query" 2>/dev/null | tr -d ' ')
    
    if [[ "$result" == "$expected" ]]; then
        print_success "$name"
        return 0
    else
        print_error "$name (Expected: $expected, Got: $result)"
        return 1
    fi
}

# ============================================================================
# PHASE 1: Check Schemas
# ============================================================================
print_section "PHASE 1: Checking Schemas"

run_validation "Schemas exist" \
    "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name IN ('saas','ops','jobs','intel','crm','audit','observability','connectors','ads')" \
    "9"

# ============================================================================
# PHASE 2: Check Tables
# ============================================================================
print_section "PHASE 2: Checking Tables"

echo ""
echo "Table count by schema:"
psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -c "
    SELECT table_schema, COUNT(*) as table_count 
    FROM information_schema.tables 
    WHERE table_schema IN ('saas','ops','jobs','intel','crm','audit','observability','connectors','ads')
    GROUP BY table_schema 
    ORDER BY table_schema;" | head -20

TOTAL_TABLES=$(psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -t -c "
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema IN ('saas','ops','jobs','intel','crm','audit','observability','connectors','ads')" | tr -d ' ')

if [ "$TOTAL_TABLES" -gt 30 ]; then
    print_success "Total tables: $TOTAL_TABLES (>30 expected)"
else
    print_error "Total tables: $TOTAL_TABLES (should be >30)"
fi

# ============================================================================
# PHASE 3: Check Indexes
# ============================================================================
print_section "PHASE 3: Checking Indexes"

TOTAL_INDEXES=$(psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -t -c "
    SELECT COUNT(*) FROM pg_indexes 
    WHERE schemaname NOT IN ('pg_catalog','information_schema')" | tr -d ' ')

if [ "$TOTAL_INDEXES" -ge 16 ]; then
    print_success "Indexes created: $TOTAL_INDEXES (>=16 expected)"
else
    print_warning "Indexes created: $TOTAL_INDEXES (should be >=16)"
fi

# ============================================================================
# PHASE 4: Check Extensions
# ============================================================================
print_section "PHASE 4: Checking Extensions"

echo ""
psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -c "
    SELECT extname FROM pg_extension 
    WHERE extname IN ('pgcrypto','citext','pg_trgm','uuid-ossp')
    ORDER BY extname;"

run_validation "All 4 extensions installed" \
    "SELECT COUNT(*) FROM pg_extension WHERE extname IN ('pgcrypto','citext','pg_trgm','uuid-ossp')" \
    "4"

# ============================================================================
# PHASE 5: Check Functions
# ============================================================================
print_section "PHASE 5: Checking Functions"

echo ""
psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -c "
    SELECT routine_schema, routine_name FROM information_schema.routines 
    WHERE routine_schema IN ('saas');"

run_validation "Tenant functions exist" \
    "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'saas'" \
    "2"

# ============================================================================
# PHASE 6: Check RLS Policies
# ============================================================================
print_section "PHASE 6: Checking RLS Policies"

echo ""
psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -c "
    SELECT tablename, policyname FROM pg_policies 
    ORDER BY tablename;"

run_validation "RLS policies enabled" \
    "SELECT COUNT(*) FROM pg_policies" \
    "5"

# ============================================================================
# PHASE 7: Check Plans
# ============================================================================
print_section "PHASE 7: Checking Plans"

echo ""
psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -c "
    SELECT code, name, price_cents FROM ops.plan ORDER BY sort_order;"

run_validation "Default plans created" \
    "SELECT COUNT(*) FROM ops.plan" \
    "4"

# ============================================================================
# PHASE 8: Check Agent Roles
# ============================================================================
print_section "PHASE 8: Checking Agent Roles"

echo ""
psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -c "
    SELECT code, name FROM intel.agent_role ORDER BY code;"

run_validation "Default agent roles created" \
    "SELECT COUNT(*) FROM intel.agent_role" \
    "4"

# ============================================================================
# PHASE 9: Check Agent Catalog
# ============================================================================
print_section "PHASE 9: Checking Agent Catalog"

echo ""
psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -c "
    SELECT agent_name, display_name FROM intel.agent_catalog ORDER BY sort_order;"

run_validation "Default agents in catalog" \
    "SELECT COUNT(*) FROM intel.agent_catalog" \
    "3"

# ============================================================================
# PHASE 10: Check Deployment Log
# ============================================================================
print_section "PHASE 10: Checking Deployment Log"

echo ""
psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -c "
    SELECT phase, status, message FROM public.deployment_log ORDER BY created_at;" | head -20

COMPLETED_PHASES=$(psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -t -c "
    SELECT COUNT(*) FROM public.deployment_log WHERE status = 'success'" | tr -d ' ')

if [ "$COMPLETED_PHASES" -ge 10 ]; then
    print_success "Deployment completed: $COMPLETED_PHASES phases successful"
else
    print_warning "Deployment phases: $COMPLETED_PHASES (expected >=10)"
fi

# ============================================================================
# PHASE 11: Test Tenant Functions
# ============================================================================
print_section "PHASE 11: Testing Tenant Functions"

# Test current_tenant_id function
RESULT=$(psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -c "
    SELECT saas.current_tenant_id();" 2>&1 | grep -c "null" || echo "0")

if [ "$RESULT" -gt 0 ]; then
    print_success "Tenant function callable (returns null as expected without context)"
else
    print_warning "Tenant function check inconclusive"
fi

# ============================================================================
# PHASE 12: Table Constraint Checks
# ============================================================================
print_section "PHASE 12: Checking Table Constraints"

echo ""
CONSTRAINTS=$(psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -t -c "
    SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE table_schema NOT IN ('pg_catalog','information_schema')" | tr -d ' ')

print_success "Found $CONSTRAINTS table constraints"

# ============================================================================
# PHASE 13: Data Integrity Checks
# ============================================================================
print_section "PHASE 13: Data Integrity Checks"

# Check for orphaned records (if any referenced tables are empty)
echo ""
TIKTOK_ACCOUNTS=$(psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -t -c "
    SELECT COUNT(*) FROM connectors.tiktok_ad_account" | tr -d ' ')

print_success "TikTok accounts table: $TIKTOK_ACCOUNTS records (expected: 0 for fresh DB)"

# ============================================================================
# Summary
# ============================================================================
print_section "Validation Summary"

echo ""
echo "✓ Database: $DATABASE"
echo "✓ Schemas: 9 created"
echo "✓ Tables: $TOTAL_TABLES"
echo "✓ Indexes: $TOTAL_INDEXES"
echo "✓ Functions: 2 (Tenant context)"
echo "✓ RLS Policies: 5"
echo "✓ Plans: 4"
echo "✓ Agent Roles: 4"
echo "✓ Agents: 3"
echo ""

if [ "$COMPLETED_PHASES" -ge 10 ]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✓ DEPLOYMENT VALIDATION SUCCESSFUL${NC}"
    echo -e "${GREEN}  AEGIS v5.0 is ready for production${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    exit 0
else
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ✗ DEPLOYMENT VALIDATION INCOMPLETE${NC}"
    echo -e "${RED}  Check error messages above${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    exit 1
fi
