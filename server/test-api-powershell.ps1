# Direct Message API Test Script using PowerShell
# Tests all endpoints of the Direct Message API
# 
# Usage: .\test-api-powershell.ps1

# Configuration
$BASE_URL = "http://localhost:4000"
$API_KEY = "b4a0744d17ecee6f8c40c0b785f19806"
$TEST_PHONE = "6005434120"
$TEST_TEMPLATE_ID = "68abd36fdefcc43101808ef3" # Real template ID from database

# Test counters
$PASSED = 0
$FAILED = 0
$TESTS = @()

# Helper function to make API requests
function Make-Request {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [string]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    $url = "$BASE_URL$Endpoint"
    $defaultHeaders = @{
        'X-API-Key' = $API_KEY
        'Content-Type' = 'application/json'
    }
    
    $allHeaders = $defaultHeaders + $Headers
    
    try {
        $params = @{
            Uri = $url
            Method = $Method
            Headers = $allHeaders
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        return @{
            Success = $true
            Data = $response
            StatusCode = 200
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorBody = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorBody)
        $errorContent = $reader.ReadToEnd()
        
        try {
            $errorData = $errorContent | ConvertFrom-Json
        }
        catch {
            $errorData = @{ error = $errorContent }
        }
        
        return @{
            Success = $false
            Data = $errorData
            StatusCode = $statusCode
            Error = $_.Exception.Message
        }
    }
}

# Test helper function
function Run-Test {
    param(
        [string]$TestName,
        [scriptblock]$TestFunction
    )
    
    Write-Host "`n🧪 Running: $TestName" -ForegroundColor Blue
    
    try {
        $result = & $TestFunction
        
        if ($result.Success) {
            Write-Host "✅ PASSED: $TestName" -ForegroundColor Green
            $script:PASSED++
            $script:TESTS += @{ Name = $TestName; Status = "PASSED" }
        }
        else {
            Write-Host "❌ FAILED: $TestName" -ForegroundColor Red
            Write-Host "   Error: $($result.Error)" -ForegroundColor Red
            $script:FAILED++
            $script:TESTS += @{ Name = $TestName; Status = "FAILED"; Error = $result.Error }
        }
    }
    catch {
        Write-Host "❌ FAILED: $TestName - Exception: $($_.Exception.Message)" -ForegroundColor Red
        $script:FAILED++
        $script:TESTS += @{ Name = $TestName; Status = "FAILED"; Error = $_.Exception.Message }
    }
}

# Test 1: Send Text Message
Run-Test "Send Text Message" {
    $body = @{
        phone = $TEST_PHONE
        type = "text"
        message = "Hello! This is a test message from the API. 🚀"
        name = "Test User"
        priority = "normal"
    } | ConvertTo-Json -Depth 3
    
    $result = Make-Request "/api/messages/m" "POST" $body
    
    if ($result.Success -and $result.Data.success) {
        Write-Host "   Message ID: $($result.Data.data.messageId)"
        Write-Host "   Status: $($result.Data.data.status)"
        return @{ Success = $true; MessageId = $result.Data.data.messageId }
    }
    
    return @{ Success = $false; Error = $result.Data.error }
}

# Test 2: Send Media Message
Run-Test "Send Media Message" {
    $body = @{
        phone = $TEST_PHONE
        type = "media"
        media = @{
            url = "https://picsum.photos/400/300"
            type = "image"
            caption = "Check out this amazing image! 📸"
            fileName = "test-image.jpg"
            mimeType = "image/jpeg"
        }
        name = "Test User"
        priority = "normal"
    } | ConvertTo-Json -Depth 3
    
    $result = Make-Request "/api/messages/m" "POST" $body
    
    if ($result.Success -and $result.Data.success) {
        Write-Host "   Message ID: $($result.Data.data.messageId)"
        Write-Host "   Status: $($result.Data.data.status)"
        return @{ Success = $true; MessageId = $result.Data.data.messageId }
    }
    
    return @{ Success = $false; Error = $result.Data.error }
}

# Test 3: Send Mixed Message
Run-Test "Send Mixed Message" {
    $body = @{
        phone = $TEST_PHONE
        type = "mixed"
        message = "Here's a mixed message with both text and media! 🎉"
        media = @{
            url = "https://picsum.photos/400/300"
            type = "image"
            caption = "Mixed content example"
            fileName = "mixed-content.jpg"
            mimeType = "image/jpeg"
        }
        name = "Test User"
        priority = "high"
    } | ConvertTo-Json -Depth 3
    
    $result = Make-Request "/api/messages/m" "POST" $body
    
    if ($result.Success -and $result.Data.success) {
        Write-Host "   Message ID: $($result.Data.data.messageId)"
        Write-Host "   Status: $($result.Data.data.status)"
        return @{ Success = $true; MessageId = $result.Data.data.messageId }
    }
    
    return @{ Success = $false; Error = $result.Data.error }
}

# Test 4: Send Template Message
Run-Test "Send Template Message" {
    $body = @{
        templateId = $TEST_TEMPLATE_ID
        variables = @{
            name = "John Doe"
            company = "Test Company"
            amount = "$100"
        }
    } | ConvertTo-Json -Depth 3
    
    $result = Make-Request "/api/messages/m/$TEST_PHONE/t/$TEST_TEMPLATE_ID" "POST" $body
    
    if ($result.Success -and $result.Data.success) {
        Write-Host "   Message ID: $($result.Data.data.messageId)"
        Write-Host "   Status: $($result.Data.data.status)"
        return @{ Success = $true; MessageId = $result.Data.data.messageId }
    }
    
    return @{ Success = $false; Error = $result.Data.error }
}

# Test 5: Send Bulk Messages
Run-Test "Send Bulk Messages" {
    $body = @{
        messages = @(
            @{
                phone = $TEST_PHONE
                type = "text"
                message = "Bulk message 1: Hello! 👋"
                priority = "normal"
            },
            @{
                phone = $TEST_PHONE
                type = "text"
                message = "Bulk message 2: How are you? 😊"
                priority = "normal"
            },
            @{
                phone = $TEST_PHONE
                type = "text"
                message = "Bulk message 3: This is a test! 🧪"
                priority = "low"
            }
        )
    } | ConvertTo-Json -Depth 3
    
    $result = Make-Request "/api/messages/m/bulk" "POST" $body
    
    if ($result.Success -and $result.Data.success) {
        Write-Host "   Processed: $($result.Data.data.totalProcessed) messages"
        Write-Host "   Errors: $($result.Data.data.totalErrors)"
        Write-Host "   Results: $($result.Data.data.results.Count) successful"
        return @{ Success = $true }
    }
    
    return @{ Success = $false; Error = $result.Data.error }
}

# Test 6: Get Message History
Run-Test "Get Message History" {
    $result = Make-Request "/api/messages/m/history?page=1&limit=10"
    
    if ($result.Success -and $result.Data.success) {
        Write-Host "   Total messages: $($result.Data.pagination.total)"
        Write-Host "   Messages returned: $($result.Data.messages.Count)"
        Write-Host "   Pages: $($result.Data.pagination.pages)"
        return @{ Success = $true }
    }
    
    return @{ Success = $false; Error = $result.Data.error }
}

# Test 7: Get Message Statistics
Run-Test "Get Message Statistics" {
    $result = Make-Request "/api/messages/m/stats"
    
    if ($result.Success -and $result.Data.success) {
        Write-Host "   Total: $($result.Data.stats.total)"
        Write-Host "   Sent: $($result.Data.stats.sent)"
        Write-Host "   Failed: $($result.Data.stats.failed)"
        Write-Host "   Pending: $($result.Data.stats.pending)"
        return @{ Success = $true }
    }
    
    return @{ Success = $false; Error = $result.Data.error }
}

# Test 8: Test Invalid Authentication
Run-Test "Test Invalid Authentication" {
    $result = Make-Request "/api/messages/m/history" "GET" $null @{ 'X-API-Key' = 'invalid_key' }
    
    if (-not $result.Success -and $result.StatusCode -eq 401) {
        Write-Host "   Correctly rejected invalid API key"
        return @{ Success = $true }
    }
    
    return @{ Success = $false; Error = "Should have rejected invalid API key" }
}

# Test 9: Test Validation Errors
Run-Test "Test Validation Errors" {
    $longMessage = "A" * 5000
    $body = @{
        phone = "invalid_phone"
        type = "invalid_type"
        message = $longMessage
    } | ConvertTo-Json -Depth 3
    
    $result = Make-Request "/api/messages/m" "POST" $body
    
    if (-not $result.Success -and $result.StatusCode -eq 400) {
        Write-Host "   Correctly rejected invalid data"
        Write-Host "   Validation errors: $($result.Data.details.Count)"
        return @{ Success = $true }
    }
    
    return @{ Success = $false; Error = "Should have rejected invalid data" }
}

# Test 10: Test Rate Limiting
Run-Test "Test Rate Limiting" {
    Write-Host "   Sending multiple requests quickly..."
    
    $successCount = 0
    $rateLimitedCount = 0
    
    for ($i = 1; $i -le 5; $i++) {
        $body = @{
            phone = $TEST_PHONE
            type = "text"
            message = "Rate limit test message $i"
            priority = "low"
        } | ConvertTo-Json -Depth 3
        
        $result = Make-Request "/api/messages/m" "POST" $body
        
        if ($result.Success -and $result.Data.success) {
            $successCount++
        }
        elseif ($result.StatusCode -eq 429) {
            $rateLimitedCount++
        }
        
        Start-Sleep -Milliseconds 100
    }
    
    Write-Host "   Successful: $successCount"
    Write-Host "   Rate limited: $rateLimitedCount"
    
    if ($successCount -gt 0) {
        return @{ Success = $true }
    }
    else {
        return @{ Success = $false; Error = "No requests succeeded" }
    }
}

# Main execution
Write-Host "🚀 Starting Direct Message API Tests" -ForegroundColor Yellow
Write-Host "====================================="
Write-Host "Base URL: $BASE_URL"
Write-Host "API Key: $($API_KEY.Substring(0, 8))..."
Write-Host "Test Phone: $TEST_PHONE"
Write-Host "Template ID: $TEST_TEMPLATE_ID"

# Wait a bit for server to be ready
Write-Host "`n⏳ Waiting 2 seconds for server to be ready..."
Start-Sleep -Seconds 2

# Run all tests
Run-Test "Send Text Message" { & { $body = @{ phone = $TEST_PHONE; type = "text"; message = "Hello! This is a test message from the API. 🚀"; name = "Test User"; priority = "normal" } | ConvertTo-Json -Depth 3; $result = Make-Request "/api/messages/m" "POST" $body; if ($result.Success -and $result.Data.success) { Write-Host "   Message ID: $($result.Data.data.messageId)"; Write-Host "   Status: $($result.Data.data.status)"; return @{ Success = $true; MessageId = $result.Data.data.messageId } } else { return @{ Success = $false; Error = $result.Data.error } } } }
Run-Test "Send Media Message" { & { $body = @{ phone = $TEST_PHONE; type = "media"; media = @{ url = "https://picsum.photos/400/300"; type = "image"; caption = "Check out this amazing image! 📸"; fileName = "test-image.jpg"; mimeType = "image/jpeg" }; name = "Test User"; priority = "normal" } | ConvertTo-Json -Depth 3; $result = Make-Request "/api/messages/m" "POST" $body; if ($result.Success -and $result.Data.success) { Write-Host "   Message ID: $($result.Data.data.messageId)"; Write-Host "   Status: $($result.Data.data.status)"; return @{ Success = $true; MessageId = $result.Data.data.messageId } } else { return @{ Success = $false; Error = $result.Data.error } } } }
Run-Test "Send Mixed Message" { & { $body = @{ phone = $TEST_PHONE; type = "mixed"; message = "Here's a mixed message with both text and media! 🎉"; media = @{ url = "https://picsum.photos/400/300"; type = "image"; caption = "Mixed content example"; fileName = "mixed-content.jpg"; mimeType = "image/jpeg" }; name = "Test User"; priority = "high" } | ConvertTo-Json -Depth 3; $result = Make-Request "/api/messages/m" "POST" $body; if ($result.Success -and $result.Data.success) { Write-Host "   Message ID: $($result.Data.data.messageId)"; Write-Host "   Status: $($result.Data.data.status)"; return @{ Success = $true; MessageId = $result.Data.data.messageId } } else { return @{ Success = $false; Error = $result.Data.error } } } }
Run-Test "Send Template Message" { & { $body = @{ templateId = $TEST_TEMPLATE_ID; variables = @{ name = "John Doe"; company = "Test Company"; amount = "$100" } } | ConvertTo-Json -Depth 3; $result = Make-Request "/api/messages/m/$TEST_PHONE/t/$TEST_TEMPLATE_ID" "POST" $body; if ($result.Success -and $result.Data.success) { Write-Host "   Message ID: $($result.Data.data.messageId)"; Write-Host "   Status: $($result.Data.data.status)"; return @{ Success = $true; MessageId = $result.Data.data.messageId } } else { return @{ Success = $false; Error = $result.Data.error } } } }
Run-Test "Send Bulk Messages" { & { $body = @{ messages = @( @{ phone = $TEST_PHONE; type = "text"; message = "Bulk message 1: Hello! 👋"; priority = "normal" }, @{ phone = $TEST_PHONE; type = "text"; message = "Bulk message 2: How are you? 😊"; priority = "normal" }, @{ phone = $TEST_PHONE; type = "text"; message = "Bulk message 3: This is a test! 🧪"; priority = "low" } ) } | ConvertTo-Json -Depth 3; $result = Make-Request "/api/messages/m/bulk" "POST" $body; if ($result.Success -and $result.Data.success) { Write-Host "   Processed: $($result.Data.data.totalProcessed) messages"; Write-Host "   Errors: $($result.Data.data.totalErrors)"; Write-Host "   Results: $($result.Data.data.results.Count) successful"; return @{ Success = $true } } else { return @{ Success = $false; Error = $result.Data.error } } } }
Run-Test "Get Message History" { & { $result = Make-Request "/api/messages/m/history?page=1&limit=10"; if ($result.Success -and $result.Data.success) { Write-Host "   Total messages: $($result.Data.pagination.total)"; Write-Host "   Messages returned: $($result.Data.messages.Count)"; Write-Host "   Pages: $($result.Data.pagination.pages)"; return @{ Success = $true } } else { return @{ Success = $false; Error = $result.Data.error } } } }
Run-Test "Get Message Statistics" { & { $result = Make-Request "/api/messages/m/stats"; if ($result.Success -and $result.Data.success) { Write-Host "   Total: $($result.Data.stats.total)"; Write-Host "   Sent: $($result.Data.stats.sent)"; Write-Host "   Failed: $($result.Data.stats.failed)"; Write-Host "   Pending: $($result.Data.stats.pending)"; return @{ Success = $true } } else { return @{ Success = $false; Error = $result.Data.error } } } }
Run-Test "Test Invalid Authentication" { & { $result = Make-Request "/api/messages/m/history" "GET" $null @{ 'X-API-Key' = 'invalid_key' }; if (-not $result.Success -and $result.StatusCode -eq 401) { Write-Host "   Correctly rejected invalid API key"; return @{ Success = $true } } else { return @{ Success = $false; Error = "Should have rejected invalid API key" } } } }
Run-Test "Test Validation Errors" { & { $longMessage = "A" * 5000; $body = @{ phone = "invalid_phone"; type = "invalid_type"; message = $longMessage } | ConvertTo-Json -Depth 3; $result = Make-Request "/api/messages/m" "POST" $body; if (-not $result.Success -and $result.StatusCode -eq 400) { Write-Host "   Correctly rejected invalid data"; Write-Host "   Validation errors: $($result.Data.details.Count)"; return @{ Success = $true } } else { return @{ Success = $false; Error = "Should have rejected invalid data" } } } }
Run-Test "Test Rate Limiting" { & { Write-Host "   Sending multiple requests quickly..."; $successCount = 0; $rateLimitedCount = 0; for ($i = 1; $i -le 5; $i++) { $body = @{ phone = $TEST_PHONE; type = "text"; message = "Rate limit test message $i"; priority = "low" } | ConvertTo-Json -Depth 3; $result = Make-Request "/api/messages/m" "POST" $body; if ($result.Success -and $result.Data.success) { $successCount++ } elseif ($result.StatusCode -eq 429) { $rateLimitedCount++ }; Start-Sleep -Milliseconds 100 }; Write-Host "   Successful: $successCount"; Write-Host "   Rate limited: $rateLimitedCount"; if ($successCount -gt 0) { return @{ Success = $true } } else { return @{ Success = $false; Error = "No requests succeeded" } } } }

# Print results
Write-Host "`n📊 Test Results Summary" -ForegroundColor Blue
Write-Host "========================="
Write-Host "✅ Passed: $PASSED" -ForegroundColor Green
Write-Host "❌ Failed: $FAILED" -ForegroundColor Red

if (($PASSED + $FAILED) -gt 0) {
    $successRate = [math]::Round(($PASSED * 100 / ($PASSED + $FAILED)), 1)
    Write-Host "📈 Success Rate: ${successRate}%" -ForegroundColor Blue
}

Write-Host "`n📋 Detailed Results" -ForegroundColor Yellow
Write-Host "==================="
for ($i = 0; $i -lt $TESTS.Count; $i++) {
    $test = $TESTS[$i]
    $status = if ($test.Status -eq "PASSED") { "✅" } else { "❌" }
    Write-Host "$($i + 1). $status $($test.Name)"
    if ($test.Status -eq "FAILED" -and $test.Error) {
        Write-Host "   Error: $($test.Error)" -ForegroundColor Red
    }
}

Write-Host "`n📋 Test Complete" -ForegroundColor Yellow
Write-Host "=================="

# Exit with appropriate code
if ($FAILED -gt 0) {
    exit 1
} else {
    exit 0
}
