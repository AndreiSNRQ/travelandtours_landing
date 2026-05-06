<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FmsGovernanceController extends Controller
{
    private $fmsApiBase;

    public function __construct()
    {
        // In local/xampp, fmslog2 backend might be reachable via this or a configured virtual host
        $this->fmsApiBase = env('FMS_BACKEND_URL');
    }

    /**
     * Proxies reports (KPIs and Wear Tracking) from FMSLog2.
     */
    public function getReports(Request $request)
    {
        try {
            $response = Http::get("{$this->fmsApiBase}/vuis/reports", $request->all());

            if ($response->failed()) {
                return response()->json(['message' => 'Failed to fetch FMS reports'], $response->status());
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            Log::error("FmsGovernanceController@getReports: " . $e->getMessage());
            return response()->json(['message' => 'Internal Proxy Error'], 500);
        }
    }

    /**
     * Aggregates incidents and violations from FMSLog2 into a unified audit trail.
     */
    public function getAudits(Request $request)
    {
        try {
            // Fetch incidents
            $incidentsRes = Http::get("{$this->fmsApiBase}/incidents", ['status' => 'Unresolved']);

            // Fetch violations
            $violationsRes = Http::get("{$this->fmsApiBase}/violations");

            $incidents = $incidentsRes->successful() ? $incidentsRes->json() : [];
            $violations = $violationsRes->successful() ? $violationsRes->json() : [];

            // Transform and merge
            $auditTrail = collect([]);

            foreach ($incidents as $incident) {
                $auditTrail->push([
                    'id' => $incident['incident_code'] ?? ("INC-" . ($incident['id'] ?? 'ERR')),
                    'type' => 'Incident',
                    'category' => $incident['type']['name'] ?? 'General',
                    'severity' => $this->mapIncidentSeverity($incident['type']['name'] ?? ''),
                    'description' => $incident['description'] ?? 'No description provided',
                    'timestamp' => $incident['created_at'] ?? now(),
                    'entity_code' => $incident['dispatch']['order_code'] ?? ($incident['dispatch']['plate_number'] ?? 'N/A')
                ]);
            }

            foreach ($violations as $violation) {
                $auditTrail->push([
                    'id' => $violation['violation_code'] ?? ("VIOL-" . ($violation['id'] ?? 'ERR')),
                    'type' => 'Violation',
                    'category' => $violation['type']['name'] ?? 'Policy',
                    'severity' => 'Moderate',
                    'description' => "Driver Violation recorded on trip " . ($violation['dispatch']['order_code'] ?? 'N/A'),
                    'timestamp' => $violation['created_at'] ?? now(),
                    'entity_code' => $violation['dispatch']['order_code'] ?? ($violation['dispatch']['plate_number'] ?? 'N/A')
                ]);
            }

            return response()->json($auditTrail->sortByDesc('timestamp')->values());
        } catch (\Exception $e) {
            Log::error("FmsGovernanceController@getAudits: " . $e->getMessage());
            return response()->json(['message' => 'Internal Proxy Error'], 500);
        }
    }

    private function mapIncidentSeverity($typeName)
    {
        $critical = ['Accident', 'Brake Failure', 'Engine Fire'];
        if (in_array($typeName, $critical))
            return 'Critical';
        return 'Moderate';
    }
}
