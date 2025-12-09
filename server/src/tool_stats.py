"""
工具调用统计
"""
import time
from typing import Dict, List
from collections import defaultdict


class ToolStats:
    def __init__(self):
        self.stats = defaultdict(lambda: {
            "total_calls": 0,
            "success_calls": 0,
            "failed_calls": 0,
            "total_time": 0.0,
            "avg_time": 0.0,
            "last_called": 0,
            "errors": []
        })
    
    def record_call(self, tool_name: str, success: bool, execution_time: float, error: str = None):
        """记录工具调用"""
        stat = self.stats[tool_name]
        stat["total_calls"] += 1
        stat["last_called"] = time.time()
        
        if success:
            stat["success_calls"] += 1
            stat["total_time"] += execution_time
            stat["avg_time"] = stat["total_time"] / stat["success_calls"]
        else:
            stat["failed_calls"] += 1
            if error:
                # 只保留最近10个错误
                stat["errors"].append({
                    "error": error,
                    "timestamp": time.time()
                })
                if len(stat["errors"]) > 10:
                    stat["errors"] = stat["errors"][-10:]
    
    def get_stats(self, tool_name: str = None) -> Dict:
        """获取统计信息"""
        if tool_name:
            return dict(self.stats.get(tool_name, {}))
        return {name: dict(stat) for name, stat in self.stats.items()}
    
    def get_summary(self) -> Dict:
        """获取总体统计"""
        total_calls = sum(s["total_calls"] for s in self.stats.values())
        total_success = sum(s["success_calls"] for s in self.stats.values())
        total_failed = sum(s["failed_calls"] for s in self.stats.values())
        
        return {
            "total_tools": len(self.stats),
            "total_calls": total_calls,
            "success_calls": total_success,
            "failed_calls": total_failed,
            "success_rate": f"{(total_success / total_calls * 100):.1f}%" if total_calls > 0 else "0%",
            "tools": list(self.stats.keys())
        }


# 全局实例
tool_stats = ToolStats()
