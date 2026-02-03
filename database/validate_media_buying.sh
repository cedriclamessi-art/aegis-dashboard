#!/bin/bash

# AEGIS MEDIA BUYING - Validation Script
# Usage: bash database/validate_media_buying.sh

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_section() { echo ""; echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; echo "$1"; }

HOSTNAME="localhost"
USERNAME="postgres"
DATABASE="aegis_db"
PORT="5432"

while getopts "h:U:d:p:" opt; do
  case $opt in
    h) HOSTNAME="$OPTARG" ;;
    U) USERNAME="$OPTARG" ;;
    d) DATABASE="$OPTARG" ;;
    p) PORT="$OPTARG" ;;
  esac
done

print_section "AEGIS MEDIA BUYING v2.0 - Validation"
echo "Target: $HOSTNAME:$PORT/$DATABASE"

# Check connection
if ! psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -c "SELECT 1" > /dev/null 2>&1; then
  print_error "Cannot connect to database"
  exit 1
fi

print_success "Database connected"

# ============================================================================
# PHASE 1: Check Tables
# ============================================================================
print_section "PHASE 1: Checking Tables"

TABLES=$(psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -t -c "
  SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'ads'" | tr -d ' ')

if [ "$TABLES" -ge 10 ]; then
  print_success "Tables created: $TABLES (>=10 expected)"
else
  print_error "Tables created: $TABLES (should be >=10)"
fi

# List tables
echo ""
psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -c "
  SELECT tablename FROM pg_tables WHERE schemaname = 'ads' ORDER BY tablename;"

# ============================================================================
# PHASE 2: Check Functions
# ============================================================================
print_section "PHASE 2: Checking Functions"

FUNCTIONS=$(psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -t -c "
  SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'ads'" | tr -d ' ')

if [ "$FUNCTIONS" -ge 4 ]; then
  print_success "Functions created: $FUNCTIONS (>=4 expected)"
else
  print_error "Functions: $FUNCTIONS (should be >=4)"
fi

# List functions
echo ""
psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -c "
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_schema = 'ads' ORDER BY routine_name;"

# ============================================================================
# PHASE 3: Check Indexes
# ============================================================================
print_section "PHASE 3: Checking Indexes"

INDEXES=$(psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -t -c "
  SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'ads'" | tr -d ' ')

if [ "$INDEXES" -ge 8 ]; then
  print_success "Indexes created: $INDEXES (>=8 expected)"
else
  print_error "Indexes: $INDEXES (should be >=8)"
fi

# ============================================================================
# PHASE 4: Check RLS Policies
# ============================================================================
print_section "PHASE 4: Checking RLS Policies"

RLS_POLICIES=$(psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -t -c "
  SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'ads'" | tr -d ' ')

if [ "$RLS_POLICIES" -ge 6 ]; then
  print_success "RLS policies created: $RLS_POLICIES (>=6 expected)"
else
  print_error "RLS policies: $RLS_POLICIES (should be >=6)"
fi

# ============================================================================
# PHASE 5: Check Data
# ============================================================================
print_section "PHASE 5: Checking Initial Data"

CONFIGS=$(psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -t -c "
  SELECT COUNT(*) FROM ads.platform_configs" | tr -d ' ')

print_success "Platform configs: $CONFIGS"

BENCHMARKS=$(psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -t -c "
  SELECT COUNT(*) FROM ads.performance_benchmarks" | tr -d ' ')

print_success "Performance benchmarks: $BENCHMARKS"

# ============================================================================
# PHASE 6: Test Functions
# ============================================================================
print_section "PHASE 6: Testing Functions"

echo ""
echo "Testing analyze_campaign_performance function..."
RESULT=$(psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -c "
  SELECT COUNT(*) FROM ads.analyze_campaign_performance(
    '12345678-1234-1234-1234-567812345678'::uuid,
    'test_campaign',
    'meta',
    7
  );" 2>&1 | tail -1 | tr -d ' ')

if [ "$RESULT" -gt 0 ]; then
  print_success "analyze_campaign_performance() works"
else
  print_warning "Function returned no results (normal if no data)"
fi

# ============================================================================
# PHASE 7: Check Deployment Log
# ============================================================================
print_section "PHASE 7: Checking Deployment Log"

PHASES=$(psql -h "$HOSTNAME" -U "$USERNAME" -d "$DATABASE" -p "$PORT" -c "
  SELECT phase, status FROM public.deployment_log 
  WHERE phase LIKE 'MEDIA%' OR phase LIKE '%BUDGET%'
  ORDER BY created_at DESC LIMIT 10;")

echo "$PHASES"

# ============================================================================
# Summary
# ============================================================================
print_section "VALIDATION SUMMARY"

echo ""
if [ "$TABLES" -ge 10 ] && [ "$FUNCTIONS" -ge 4 ] && [ "$INDEXES" -ge 8 ] && [ "$RLS_POLICIES" -ge 6 ]; then
  echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  ✓ AEGIS MEDIA BUYING VALIDATION SUCCESSFUL${NC}"
  echo -e "${GREEN}  Tables: $TABLES | Functions: $FUNCTIONS | Indexes: $INDEXES | RLS: $RLS_POLICIES${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
  exit 0
else
  echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${RED}  ✗ VALIDATION INCOMPLETE${NC}"
  echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
  exit 1
fi
