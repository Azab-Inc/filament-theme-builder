<?php

namespace Tests\Unit\Mcp;

use App\Mcp\Transport\StdioReadinessWaiter;
use Tests\TestCase;

class StdioReadinessWaiterTest extends TestCase
{
    public function test_positive_sub_microsecond_deadline_rounds_up_to_one_microsecond(): void
    {
        self::assertSame([0, 1], StdioReadinessWaiter::timeoutParts(1));
        self::assertSame([0, 1], StdioReadinessWaiter::timeoutParts(999));
    }

    public function test_select_timeout_rounding_carries_at_one_second(): void
    {
        self::assertSame([0, 2], StdioReadinessWaiter::timeoutParts(1_001));
        self::assertSame([1, 0], StdioReadinessWaiter::timeoutParts(999_999_999));
    }
}
