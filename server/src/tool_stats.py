"""
Tool Statistics - 工具调用统计
"""
from typing import Dict
import time


class ToolStats:
    def __init__(self):
        self.stats = {}
    
    def record_success(self, tool_name: str, duration: float):
        """记录成功调用"""
        if tool_name not in self.stats:
            self.stats[tool_name] = {
                "total_calls": 0,
                "success_calls": 0,
                "failed_calls": 0,
                "total_time": 0.0,
                "errors": []
            }
        
        self.stats[tool_name]["total_calls"] += 1
        self.stats[tool_name]["success_calls"] += 1
        self.stats[tool_name]["total_time"] += duration
    
    def record_failure(self, tool_name: str, error: str):
        """记录失败调用"""
        if tool_name not in self.stats:
            self.stats[tool_name] = {
                "total_calls": 0,
                "success_calls": 0,
                "failed_calls": 0,
                "total_time": 0.0,
                "errors": []
            }
        
        self.stats[tool_name]["total_calls"] += 1
        self.stats[tool_name]["failed_calls"] += 1
        self.stats[tool_name]["errors"].append({
            "error": error,
            "timestamp": time.time()
        })
        
        # 只保留最近10个错误
        if len(self.stats[tool_name]["errors"]) > 10:
            self.stats[tool_name]["errors"] = self.stats[tool_name]["errors"][-10:]
    
    def get_stats(self) -> Dict:
        """获取统计信息"""
        result = {}
        for tool_name, stats in self.stats.items():
            avg_time = 0
            if stats["success_calls"] > 0:
                avg_time = stats["total_time"] / stats["success_calls"]
            
            result[tool_name] = {
                **stats,
                "avg_time": round(avg_time, 3),
                "success_rate": round(
                    stats["success_calls"] / stats["total_calls"] * 100, 1
                ) if stats["total_calls"] > 0 else 0
            }
        
        return result
